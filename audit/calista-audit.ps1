param(
    [string]$BaseUrl = "https://calistalife.com",
    [int]$MaxLinksPerPage = 50,
    [int]$MaxPages = 0,
    [int]$RequestTimeoutSec = 30
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Ensure modern TLS
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13 -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls

function Write-Log {
    param([string]$Message)
    $ts = Get-Date -Format 'HH:mm:ss'
    Write-Host "[$ts] $Message"
}

function New-Dir($path) {
    if (-not (Test-Path -LiteralPath $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
    }
    return (Resolve-Path -LiteralPath $path).Path
}

function Save-Text($path, [string]$content) {
    $dir = Split-Path -Parent $path
    New-Dir $dir | Out-Null
    [IO.File]::WriteAllText($path, $content, [Text.Encoding]::UTF8)
}

function Url-HostSlug([string]$host) {
    return ($host -replace "[^a-zA-Z0-9-]","-")
}

function Get-UserAgent {
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) CalistaAudit/1.0 Chrome/120.0 Safari/537.36"
}

function Invoke-Http($url, [string]$method='GET') {
    try {
        $resp = Invoke-WebRequest -Uri $url -Method $method -MaximumRedirection 5 -TimeoutSec $RequestTimeoutSec -Headers @{ 'User-Agent' = (Get-UserAgent) }
        return [PSCustomObject]@{
            Url        = $url
            StatusCode = $resp.StatusCode
            Headers    = $resp.Headers
            Content    = $resp.Content
            FinalUrl   = ($resp.BaseResponse.ResponseUri.AbsoluteUri)
        }
    }
    catch {
        return [PSCustomObject]@{
            Url        = $url
            StatusCode = $null
            Headers    = @{}
            Content    = ""
            FinalUrl   = $null
            Error      = $_.Exception.Message
        }
    }
}

function Curl-Metrics($url) {
    $curlPath = (Get-Command curl.exe -ErrorAction SilentlyContinue)?.Source
    if (-not $curlPath) { return $null }
    $fmt = @(
        'http_code=%{http_code}',
        'namelookup=%{time_namelookup}',
        'connect=%{time_connect}',
        'appconnect=%{time_appconnect}',
        'starttransfer=%{time_starttransfer}',
        'redirect=%{time_redirect}',
        'total=%{time_total}',
        'size=%{size_download}',
        'speed=%{speed_download}',
        'final=%{url_effective}'
    ) -join ';'
    $args = @('-L','-s','-o','NUL','-w',"$fmt",'--max-redirs','5',"$url")
    try {
        $out = & $curlPath @args
        $kv = @{}
        foreach ($pair in $out -split ';') {
            if ($pair -match '^(?<k>[^=]+)=(?<v>.*)$') { $kv[$matches.k] = $matches.v }
        }
        return [PSCustomObject]$kv
    } catch { return $null }
}

function Read-XmlFromUrl($url) {
    try {
        $bytes = (Invoke-WebRequest -Uri $url -Headers @{ 'User-Agent' = (Get-UserAgent) } -TimeoutSec $RequestTimeoutSec -MaximumRedirection 5).Content
        [xml]$xml = $bytes
        return $xml
    } catch {
        # try gz
        try {
            $raw = Invoke-WebRequest -Uri $url -Headers @{ 'User-Agent' = (Get-UserAgent) } -TimeoutSec $RequestTimeoutSec -MaximumRedirection 5 -OutFile (Join-Path $env:TEMP 'smap.gz')
            $gzPath = (Join-Path $env:TEMP 'smap.gz')
            if (Test-Path $gzPath) {
                $ms = New-Object IO.MemoryStream (Get-Content -LiteralPath $gzPath -AsByteStream)
                $gs = New-Object IO.Compression.GzipStream($ms, [IO.Compression.CompressionMode]::Decompress)
                $outMs = New-Object IO.MemoryStream
                $gs.CopyTo($outMs)
                $gs.Dispose(); $ms.Dispose()
                $utf8 = [Text.Encoding]::UTF8.GetString($outMs.ToArray())
                [xml]$xml = $utf8
                return $xml
            }
        } catch {}
    }
    return $null
}

function Get-SitemapUrls($baseUrl) {
    $u = [Uri]$baseUrl
    $host = $u.GetLeftPart([UriPartial]::Authority)
    $candidates = New-Object System.Collections.Generic.List[string]

    # robots.txt
    foreach ($proto in @('https','http')) {
        $robots = "$proto://$($u.Host)/robots.txt"
        try {
            $r = Invoke-WebRequest -Uri $robots -Headers @{ 'User-Agent' = (Get-UserAgent) } -TimeoutSec $RequestTimeoutSec
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
                foreach ($line in ($r.Content -split "`n")) {
                    if ($line -match '(?i)^sitemap:\s*(?<sm>\S+)') { $candidates.Add($matches.sm) }
                }
            }
        } catch {}
    }

    # common endpoints
    foreach ($path in @('/sitemap.xml','/sitemap_index.xml','/sitemap1.xml')) {
        foreach ($proto in @('https','http')) {
            $sm = "$proto://$($u.Host)$path"
            if (-not $candidates.Contains($sm)) { $candidates.Add($sm) }
        }
    }

    # validate
    $valid = @()
    foreach ($sm in $candidates) {
        try {
            $head = Invoke-WebRequest -Uri $sm -Method Head -Headers @{ 'User-Agent' = (Get-UserAgent) } -TimeoutSec $RequestTimeoutSec
            if ($head.StatusCode -ge 200 -and $head.StatusCode -lt 400) { $valid += $sm }
        } catch {}
    }
    $valid | Select-Object -Unique
}

function Expand-Sitemap($smUrl) {
    $xml = Read-XmlFromUrl $smUrl
    if (-not $xml) { return @() }
    $ns = @{ sm = 'http://www.sitemaps.org/schemas/sitemap/0.9' }
    $urls = New-Object System.Collections.Generic.List[string]
    if ($xml.DocumentElement.LocalName -eq 'sitemapindex') {
        foreach ($n in $xml.DocumentElement.SelectNodes('//sm:sitemap/sm:loc',$ns)) {
            $urls.AddRange((Expand-Sitemap $n.InnerText))
        }
    }
    elseif ($xml.DocumentElement.LocalName -eq 'urlset') {
        foreach ($n in $xml.DocumentElement.SelectNodes('//sm:url/sm:loc',$ns)) {
            $urls.Add($n.InnerText.Trim())
        }
    }
    $urls.ToArray() | Select-Object -Unique
}

function Is-InternalUrl($url, $host) {
    try { return ([Uri]$url).Host -eq $host } catch { return $false }
}

function Resolve-AbsoluteUrl($href, [Uri]$base) {
    if ([string]::IsNullOrWhiteSpace($href)) { return $null }
    try {
        if ($href.StartsWith('#')) { return $null }
        if ($href.StartsWith('mailto:', 'OrdinalIgnoreCase') -or $href.StartsWith('tel:', 'OrdinalIgnoreCase') -or $href.StartsWith('javascript:', 'OrdinalIgnoreCase')) { return $null }
        $u = New-Object System.Uri($base, $href)
        return $u.AbsoluteUri
    } catch { return $null }
}

function Strip-Html($s) { if ($null -eq $s) { return $null } return (($s -replace '(?is)<script.*?</script>','') -replace '(?is)<style.*?</style>','') -replace '(?s)<[^>]+>','' }

function Get-Matches($pattern, $text) {
    if ([string]::IsNullOrEmpty($text)) { return @() }
    return [regex]::Matches($text, $pattern, [Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [Text.RegularExpressions.RegexOptions]::Singleline)
}

function Extract-Metadata($html, [Uri]$base) {
    $title = ($m = Get-Matches '<title[^>]*>(.*?)</title>' $html; if ($m.Count -gt 0) { ($m[0].Groups[1].Value -replace '\s+',' ').Trim() } else { '' })
    $metaDesc = ($m = Get-Matches '<meta[^>]*name\s*=\s*(["''])description\1[^>]*>' $html; if ($m.Count -gt 0) { ($m[0].Value -replace '(?is).*?content\s*=\s*(["''])(.*?)\1.*','$2') } else { '' })

    $h1s = @(); foreach ($m in (Get-Matches '<h1[^>]*>(.*?)</h1>' $html)) { $h1s += (Strip-Html $m.Groups[1].Value).Trim() }
    $h2s = @(); foreach ($m in (Get-Matches '<h2[^>]*>(.*?)</h2>' $html)) { $h2s += (Strip-Html $m.Groups[1].Value).Trim() }

    $imgs = Get-Matches '<img\b[^>]*>' $html
    $imgTotal = $imgs.Count
    $imgMissingAlt = 0
    $lazyCount = 0
    foreach ($img in $imgs) {
        $tag = $img.Value
        $hasAlt = $tag -match '(?i)\balt\s*=\s*("([^"]*)"|'" + "'([^']*)'" + "|([^\s>]+))'
        if (-not $hasAlt) { $imgMissingAlt++ }
        elseif ($matches[2] -eq '' -and $matches[3] -eq '' -and $matches[4] -eq '') { $imgMissingAlt++ }
        if ($tag -match '(?i)\bloading\s*=\s*(["'']?)lazy\1') { $lazyCount++ }
    }

    $canonical = ($m = Get-Matches '<link[^>]*rel\s*=\s*(["''])canonical\1[^>]*>' $html; if ($m.Count -gt 0) { ($m[0].Value -replace '(?is).*?href\s*=\s*(["''])(.*?)\1.*','$2') } else { '' })
    $ogTitle = ($m = Get-Matches '<meta[^>]*property\s*=\s*(["''])og:title\1[^>]*>' $html; if ($m.Count -gt 0) { ($m[0].Value -replace '(?is).*?content\s*=\s*(["''])(.*?)\1.*','$2') } else { '' })
    $ogDesc  = ($m = Get-Matches '<meta[^>]*property\s*=\s*(["''])og:description\1[^>]*>' $html; if ($m.Count -gt 0) { ($m[0].Value -replace '(?is).*?content\s*=\s*(["''])(.*?)\1.*','$2') } else { '' })
    $viewport = (Get-Matches '<meta[^>]*name\s*=\s*(["''])viewport\1[^>]*>' $html).Count -gt 0

    $jsonldTypes = @()
    $productInfo = @()
    foreach ($m in (Get-Matches '<script[^>]*type\s*=\s*(["''])application/ld\+json\1[^>]*>(.*?)</script>' $html)) {
        $json = $m.Groups[2].Value.Trim()
        if (-not $json) { continue }
        try {
            $obj = $json | ConvertFrom-Json -ErrorAction Stop
            $items = @()
            if ($obj -is [System.Collections.IEnumerable]) { $items = @($obj) } else { $items = @($obj) }
            $flat = @()
            foreach ($it in $items) {
                if ($it.'@graph') { $flat += @($it.'@graph') } else { $flat += $it }
            }
            foreach ($it in $flat) {
                $t = [string]$it.'@type'
                if ($t) { $jsonldTypes += $t }
                if ($t -match '(?i)Product') {
                    $price = $null; $availability = $null; $rating = $null
                    if ($it.offers) {
                        $price = $it.offers.price
                        $availability = $it.offers.availability
                    }
                    if ($it.aggregateRating) { $rating = $it.aggregateRating.ratingValue }
                    $productInfo += [PSCustomObject]@{ Price=$price; Availability=$availability; Rating=$rating }
                }
            }
        } catch {}
    }

    # Links (internal)
    $links = @()
    foreach ($a in (Get-Matches '<a[^>]*href\s*=\s*("([^"]*)"|'" + "'([^']*)'" + "|([^\s>]+))' $html)) {
        $href = $null
        if ($a.Groups[2].Success) { $href = $a.Groups[2].Value }
        elseif ($a.Groups[3].Success) { $href = $a.Groups[3].Value }
        elseif ($a.Groups[4].Success) { $href = $a.Groups[4].Value }
        $abs = Resolve-AbsoluteUrl $href $base
        if ($abs) { $links += $abs }
    }

    [PSCustomObject]@{
        Title                  = $title
        MetaDescription        = $metaDesc
        H1s                    = $h1s
        H2s                    = $h2s
        ImgTotal               = $imgTotal
        ImgMissingAlt          = $imgMissingAlt
        Canonical              = $canonical
        OgTitle                = $ogTitle
        OgDescription          = $ogDesc
        Viewport               = $viewport
        LazyImgCount           = $lazyCount
        JsonLdTypes            = ($jsonldTypes | Select-Object -Unique)
        ProductStructuredData  = $productInfo
        Links                  = $links
    }
}

function Url-Readability($url) {
    try {
        $u = [Uri]$url
        $path = $u.AbsolutePath
        $slug = ($path -split '/')[-1]
        $hasUnderscore = $path -match '_'
        $hasUpper = $path -match '[A-Z]'
        $hasQuery = -not [string]::IsNullOrEmpty($u.Query)
        $length = $u.AbsoluteUri.Length
        $digitHeavy = ($slug -replace '[^0-9]','').Length -ge 6
        [PSCustomObject]@{
            HasUnderscore = $hasUnderscore
            HasUppercase  = $hasUpper
            HasQuery      = $hasQuery
            UrlLength     = $length
            DigitHeavy    = $digitHeavy
        }
    } catch {
        return [PSCustomObject]@{ HasUnderscore=$false; HasUppercase=$false; HasQuery=$false; UrlLength=0; DigitHeavy=$false }
    }
}

# Set up output directories
$baseUri = [Uri]$BaseUrl
$host = $baseUri.Host
$hostSlug = Url-HostSlug $host
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$root = New-Dir (Join-Path (Get-Location) "audit-$hostSlug-$stamp")
$dirRaw = New-Dir (Join-Path $root 'raw')
$dirReports = New-Dir (Join-Path $root 'reports')
$dirAudit = New-Dir (Join-Path (Get-Location) 'audit')

# Write latest path marker
Save-Text (Join-Path $dirAudit 'latest_path.txt') $root

Write-Log "Audit output directory: $root"

# Discover sitemaps
Write-Log "Discovering sitemap URLs..."
$sitemaps = Get-SitemapUrls $BaseUrl | Select-Object -Unique
if ($sitemaps.Count -eq 0) { Write-Log "No sitemaps discovered. Will try to crawl from homepage only." }
else { Write-Log ("Found {0} sitemap(s)" -f $sitemaps.Count) }

# Expand sitemaps to URL list
$allUrls = New-Object System.Collections.Generic.List[string]
foreach ($sm in $sitemaps) {
    Write-Log "Expanding sitemap: $sm"
    $urls = Expand-Sitemap $sm
    foreach ($u in $urls) { $allUrls.Add($u) }
}

if ($allUrls.Count -eq 0) {
    # fallback: homepage and main links from homepage
    Write-Log "Fetching homepage to seed URLs..."
    $home = Invoke-Http $BaseUrl
    if ($home.Content) {
        $meta = Extract-Metadata $home.Content $baseUri
        foreach ($l in $meta.Links) {
            if (Is-InternalUrl $l $host) { $allUrls.Add($l) }
        }
        $allUrls.Add($home.FinalUrl ?? $BaseUrl) | Out-Null
    }
}

# Keep only internal and unique
$allUrls = $allUrls | Where-Object { $_ -and (Is-InternalUrl $_ $host) } | Select-Object -Unique

if ($MaxPages -gt 0 -and $allUrls.Count -gt $MaxPages) {
    Write-Log "URL count $($allUrls.Count) exceeds MaxPages=$MaxPages. Truncating to $MaxPages for this run."
    $allUrls = $allUrls | Select-Object -First $MaxPages
}

Save-Text (Join-Path $root 'url-list.txt') (($allUrls -join "`r`n"))

Write-Log ("Total URLs to analyze: {0}" -f $allUrls.Count)

$results = New-Object System.Collections.Generic.List[object]
$linkChecks = New-Object System.Collections.Generic.List[object]

# Analyze each page
$idx = 0
foreach ($url in $allUrls) {
    $idx++
    Write-Log ("[{0}/{1}] Fetching {2}" -f $idx, $allUrls.Count, $url)

    $resp = Invoke-Http $url
    $perf = Curl-Metrics $url
    $meta = Extract-Metadata $resp.Content $([Uri]$resp.FinalUrl ?? $baseUri)

    # Security & privacy headers
    $h = $resp.Headers
    $sec = [PSCustomObject]@{
        HSTS                  = [string]$h['Strict-Transport-Security']
        CSP                   = [string]$h['Content-Security-Policy']
        XFrameOptions         = [string]$h['X-Frame-Options']
        XContentTypeOptions   = [string]$h['X-Content-Type-Options']
        ReferrerPolicy        = [string]$h['Referrer-Policy']
        PermissionsPolicy     = [string]$h['Permissions-Policy']
        CORP                  = [string]$h['Cross-Origin-Resource-Policy']
        COOP                  = [string]$h['Cross-Origin-Opener-Policy']
        Server                = [string]$h['Server']
        CFCache               = [string]$h['cf-cache-status']
        CacheControl          = [string]$h['Cache-Control']
        CDN                   = if ($h['cf-ray'] -or $h['server'] -match 'cloudflare') { 'Cloudflare' } else { '' }
        SetCookie             = @($h['Set-Cookie'])
    }

    $readability = Url-Readability $resp.FinalUrl

    $pageObj = [PSCustomObject]@{
        Url                 = $resp.FinalUrl ?? $url
        StatusCode          = $resp.StatusCode
        Title               = $meta.Title
        TitleLength         = ($meta.Title ?? '').Length
        MetaDescription     = $meta.MetaDescription
        MetaDescriptionLen  = ($meta.MetaDescription ?? '').Length
        H1Count             = $meta.H1s.Count
        H2Count             = $meta.H2s.Count
        ImgTotal            = $meta.ImgTotal
        ImgMissingAlt       = $meta.ImgMissingAlt
        Canonical           = $meta.Canonical
        OgTitle             = $meta.OgTitle
        OgDescription       = $meta.OgDescription
        Viewport            = $meta.Viewport
        LazyImgCount        = $meta.LazyImgCount
        JsonLdTypes         = $meta.JsonLdTypes
        ProductData         = $meta.ProductStructuredData
        Perf                = $perf
        SecHeaders          = $sec
        UrlReadability      = $readability
        FetchError          = $resp.Error
    }

    $results.Add($pageObj) | Out-Null

    # Save raw HTML for reference
    try {
        $safe = ($pageObj.Url -replace '[^a-zA-Z0-9]+','-').Trim('-')
        $rawPath = Join-Path $dirRaw ("$safe.html")
        Save-Text $rawPath $resp.Content
    } catch {}

    # Link checks (internal only)
    $internalLinks = $meta.Links | Where-Object { Is-InternalUrl $_ $host } | Select-Object -Unique | Select-Object -First $MaxLinksPerPage
    foreach ($l in $internalLinks) {
        $cm = Curl-Metrics $l
        $linkChecks.Add([PSCustomObject]@{
            From = $pageObj.Url
            To   = $l
            Http = $cm.http_code
            Total= [double]$cm.total
            Redirects = $cm.redirect
            Final = $cm.final
        }) | Out-Null
    }
}

# Write detail outputs
$pagesNd = ($results | ForEach-Object { $_ | ConvertTo-Json -Depth 8 }) -join "`n"
Save-Text (Join-Path $dirReports 'pages.ndjson') $pagesNd

$linkNd = ($linkChecks | ForEach-Object { $_ | ConvertTo-Json -Depth 5 }) -join "`n"
Save-Text (Join-Path $dirReports 'link-check.ndjson') $linkNd

# Build summary and issues
function New-Issue($category,$severity,$url,$detail) {
    [PSCustomObject]@{ Category=$category; Severity=$severity; Url=$url; Detail=$detail }
}

$issues = New-Object System.Collections.Generic.List[object]

# Missing titles / meta
$results | Where-Object { -not $_.Title } | ForEach-Object { $issues.Add((New-Issue 'SEO' 'High' $_.Url 'Missing <title>')) } | Out-Null
$results | Where-Object { -not $_.MetaDescription } | ForEach-Object { $issues.Add((New-Issue 'SEO' 'Medium' $_.Url 'Missing meta description')) } | Out-Null

# Duplicate titles/descriptions
$dupTitles = $results | Group-Object { ($_.Title ?? '') .ToLower() } | Where-Object { $_.Count -gt 1 -and $_.Name }
foreach ($g in $dupTitles) {
    foreach ($p in $g.Group) { $issues.Add((New-Issue 'SEO' 'Medium' $p.Url ("Duplicate title: " + $g.Name))) | Out-Null }
}
$dupDescs = $results | Group-Object { ($_.MetaDescription ?? '') .ToLower() } | Where-Object { $_.Count -gt 1 -and $_.Name }
foreach ($g in $dupDescs) {
    foreach ($p in $g.Group) { $issues.Add((New-Issue 'SEO' 'Low' $p.Url ("Duplicate meta description: " + ($g.Name.Substring(0, [Math]::Min(80,$g.Name.Length))))) }) | Out-Null }

# Headings
$results | Where-Object { $_.H1Count -lt 1 } | ForEach-Object { $issues.Add((New-Issue 'SEO' 'High' $_.Url 'Missing H1')) } | Out-Null

# Images alt
$results | Where-Object { $_.ImgMissingAlt -gt 0 } | ForEach-Object { $issues.Add((New-Issue 'SEO' 'Medium' $_.Url ("Images missing alt: " + $_.ImgMissingAlt))) } | Out-Null

# Canonical
$results | Where-Object { -not $_.Canonical } | ForEach-Object { $issues.Add((New-Issue 'SEO' 'Low' $_.Url 'Missing canonical link')) } | Out-Null

# Structured data
$probProducts = $results | Where-Object { $_.Url -match '/product|/products/' }
$probProducts | Where-Object { -not $_.ProductData -or $_.ProductData.Count -eq 0 } | ForEach-Object { $issues.Add((New-Issue 'StructuredData' 'High' $_.Url 'Missing Product JSON-LD')) } | Out-Null

# Security headers
$results | Where-Object { -not $_.SecHeaders.HSTS } | ForEach-Object { $issues.Add((New-Issue 'Security' 'High' $_.Url 'Missing Strict-Transport-Security')) } | Out-Null
$results | Where-Object { -not $_.SecHeaders.CSP } | ForEach-Object { $issues.Add((New-Issue 'Security' 'Medium' $_.Url 'Missing Content-Security-Policy')) } | Out-Null
$results | Where-Object { -not $_.SecHeaders.XContentTypeOptions } | ForEach-Object { $issues.Add((New-Issue 'Security' 'Medium' $_.Url 'Missing X-Content-Type-Options')) } | Out-Null
$results | Where-Object { -not $_.SecHeaders.XFrameOptions } | ForEach-Object { $issues.Add((New-Issue 'Security' 'Low' $_.Url 'Missing X-Frame-Options')) } | Out-Null

# Performance (heuristics)
$results | ForEach-Object {
    if ($_.Perf) {
        $total = [double]$_.Perf.total
        $start = [double]$_.Perf.starttransfer
        if ($total -gt 3.0) { $issues.Add((New-Issue 'Performance' 'High' $_.Url ("Slow total load (curl) ~ " + ('{0:N2}' -f $total) + 's'))) | Out-Null }
        if ($start -gt 1.0) { $issues.Add((New-Issue 'Performance' 'Medium' $_.Url ("High TTFB (curl starttransfer) ~ " + ('{0:N2}' -f $start) + 's'))) | Out-Null }
        $size = [double]$_.Perf.size
        if ($size -gt 2000000) { $issues.Add((New-Issue 'Performance' 'Medium' $_.Url ("Large transfer size ~ " + [Math]::Round($size/1024/1024,2) + ' MB'))) | Out-Null }
    }
}

# URL readability
$results | Where-Object { $_.UrlReadability.HasUnderscore -or $_.UrlReadability.HasUppercase -or $_.UrlReadability.HasQuery -or $_.UrlReadability.UrlLength -gt 115 } | ForEach-Object {
    $detail = @()
    if ($_.UrlReadability.HasUnderscore) { $detail += 'underscores' }
    if ($_.UrlReadability.HasUppercase) { $detail += 'uppercase' }
    if ($_.UrlReadability.HasQuery) { $detail += 'query params' }
    if ($_.UrlReadability.UrlLength -gt 115) { $detail += 'long URL' }
    $issues.Add((New-Issue 'SEO' 'Low' $_.Url ("URL readability: " + ($detail -join ', ')))) | Out-Null
} | Out-Null

# Internal link issues
$link404 = $linkChecks | Where-Object { [int]($_.Http) -ge 400 }
foreach ($li in $link404) { $issues.Add((New-Issue 'Links' 'High' $li.From ("Broken link -> " + $li.To + " (HTTP " + $li.Http + ")"))) | Out-Null }

$linkManyRedirs = $linkChecks | Where-Object { [double]$_.Redirects -gt 1 }
foreach ($li in $linkManyRedirs) { $issues.Add((New-Issue 'Links' 'Low' $li.From ("Multiple redirects -> " + $li.To))) | Out-Null }

# Cookies flags (sample first page)
if ($results.Count -gt 0) {
    $cookies = $results[0].SecHeaders.SetCookie
    foreach ($c in $cookies) {
        $hasSecure = $c -match '(?i);\s*secure'
        $hasHttpOnly = $c -match '(?i);\s*httponly'
        $hasSameSite = $c -match '(?i);\s*samesite='
        if (-not $hasSecure -or -not $hasHttpOnly -or -not $hasSameSite) {
            $issues.Add((New-Issue 'Privacy' 'Medium' $results[0].Url ("Cookie missing flags: " + (@(if(-not $hasSecure){'Secure'}; if(-not $hasHttpOnly){'HttpOnly'}; if(-not $hasSameSite){'SameSite'}) -join ', ')))) | Out-Null
        }
    }
}

# Summaries
$summary = [PSCustomObject]@{
    TotalPages           = $results.Count
    BrokenLinks          = ($link404 | Measure-Object).Count
    AvgCurlTotalSeconds  = (($results | Where-Object { $_.Perf } | ForEach-Object { [double]$_.Perf.total } | Measure-Object -Average).Average)
    PagesMissingTitle    = ($results | Where-Object { -not $_.Title } | Measure-Object).Count
    PagesMissingMeta     = ($results | Where-Object { -not $_.MetaDescription } | Measure-Object).Count
    PagesMissingH1       = ($results | Where-Object { $_.H1Count -lt 1 } | Measure-Object).Count
    PagesMissingCanonical= ($results | Where-Object { -not $_.Canonical } | Measure-Object).Count
    PagesMissingViewport = ($results | Where-Object { -not $_.Viewport } | Measure-Object).Count
    ProductPagesNoSD     = ($probProducts | Where-Object { -not $_.ProductData -or $_.ProductData.Count -eq 0 } | Measure-Object).Count
}

Save-Text (Join-Path $dirReports 'summary.json') ($summary | ConvertTo-Json -Depth 6)

# Export CSV issues and pages
$issues | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $dirReports 'issues.csv')
$results | Select-Object Url,StatusCode,Title,TitleLength,MetaDescription,MetaDescriptionLen,H1Count,H2Count,ImgTotal,ImgMissingAlt,Canonical,Viewport,LazyImgCount,JsonLdTypes,(@{Name='PerfTotal';Expression={if($_.Perf){[double]$_.Perf.total}else{$null}}),(@{Name='PerfTTFB';Expression={if($_.Perf){[double]$_.Perf.starttransfer}else{$null}}),(@{Name='SizeBytes';Expression={if($_.Perf){[double]$_.Perf.size}else{$null}}) | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $dirReports 'pages.csv')

$linkChecks | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $dirReports 'links.csv')

Write-Log "Audit complete. Outputs:"
Write-Log (Join-Path $dirReports 'summary.json')
Write-Log (Join-Path $dirReports 'issues.csv')
Write-Log (Join-Path $dirReports 'pages.csv')
Write-Log (Join-Path $dirReports 'links.csv')
