# CalistaLife Production Secret Rotation Script
# Comprehensive secret rotation and validation for production launch

param(
    [switch]$DryRun = $false,
    [switch]$ValidateOnly = $false
)

Write-Host "CalistaLife Production Secret Rotation" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

if ($DryRun) {
    Write-Host "DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
}

# Define all services requiring secret rotation
$services = @{
    "Brevo" = @{
        "url" = "https://app.brevo.com/settings/keys/api"
        "vars" = @("BREVO_API_KEY")
        "critical" = $true
    }
    "Supabase" = @{
        "url" = "https://supabase.com/dashboard/project/mrshlwfzkikpdycybqzi/settings/api"
        "vars" = @("SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY")
        "critical" = $true
    }
    "Sentry" = @{
        "url" = "https://sentry.io/settings/calista-44/auth-tokens/"
        "vars" = @("SENTRY_DSN", "VITE_SENTRY_DSN")
        "critical" = $true
    }
    "Google Analytics" = @{
        "url" = "https://console.cloud.google.com/apis/credentials"
        "vars" = @("VITE_GA4_MEASUREMENT_ID", "GA4_API_SECRET")
        "critical" = $false
    }
}

# Step 1: Validate current environment files
Write-Host "`nStep 1: Validating Environment Configuration" -ForegroundColor Cyan

$envFiles = @(
    "frontend/.env.production",
    "backend/.env.production"
)

$validationIssues = @()

foreach ($file in $envFiles) {
    if (-not (Test-Path $file)) {
        $validationIssues += "Missing file: $file"
        continue
    }
    
    Write-Host "Found: $file" -ForegroundColor Green
    
    # Check for placeholder patterns
    $content = Get-Content $file -Raw
    $placeholders = [regex]::Matches($content, '\{\{([^}]+)\}\}')
    
    if ($placeholders.Count -gt 0) {
        Write-Host "  Found $($placeholders.Count) CI/CD placeholders:" -ForegroundColor Blue
        foreach ($match in $placeholders) {
            Write-Host "    - $($match.Groups[1].Value)" -ForegroundColor Gray
        }
    }
}

# Step 2: Check git status for secrets
Write-Host "`nStep 2: Git Repository Security Check" -ForegroundColor Cyan

$trackedSecrets = git ls-files | Where-Object {$_ -match '\.env' -and $_ -notmatch 'example|sample'}
if ($trackedSecrets) {
    foreach ($secret in $trackedSecrets) {
        $validationIssues += "Secret file tracked in git: $secret"
    }
} else {
    Write-Host "No secret files tracked in git" -ForegroundColor Green
}

# Step 3: Secret rotation checklist
Write-Host "`nStep 3: Secret Rotation Checklist" -ForegroundColor Cyan

foreach ($serviceName in $services.Keys) {
    $service = $services[$serviceName]
    $status = if ($service.critical) { "CRITICAL" } else { "OPTIONAL" }
    
    Write-Host "`n$status - $serviceName" -ForegroundColor White
    Write-Host "  URL: $($service.url)" -ForegroundColor Blue
    Write-Host "  Variables to update:" -ForegroundColor Gray
    foreach ($var in $service.vars) {
        Write-Host "    - $var" -ForegroundColor Gray
    }
}

# Step 4: CI/CD Integration Commands
Write-Host "`nStep 4: CI/CD Secret Injection Commands" -ForegroundColor Cyan

Write-Host "`nFor Vercel deployment:" -ForegroundColor Blue
$vercelCommands = @(
    "vercel env add VITE_SENTRY_DSN production",
    "vercel env add SUPABASE_SERVICE_ROLE_KEY production",
    "vercel env add BREVO_API_KEY production",
    "vercel env add VITE_GA4_MEASUREMENT_ID production"
)
foreach ($cmd in $vercelCommands) {
    Write-Host "  $cmd" -ForegroundColor White
}

Write-Host "`nFor GitHub Actions:" -ForegroundColor Blue
$githubCommands = @(
    'gh secret set VITE_SENTRY_DSN --body "your_new_sentry_dsn"',
    'gh secret set SUPABASE_SERVICE_ROLE_KEY --body "your_new_supabase_key"',
    'gh secret set BREVO_API_KEY --body "your_new_brevo_key"',
    'gh secret set VITE_GA4_MEASUREMENT_ID --body "G-FL9QNKMXPX"'
)
foreach ($cmd in $githubCommands) {
    Write-Host "  $cmd" -ForegroundColor White
}

# Step 5: Validation Tests
Write-Host "`nStep 5: Post-Rotation Validation Tests" -ForegroundColor Cyan

$validationTests = @(
    "GA4 Events: Visit your site with ?debug_mode=true and check DebugView",
    "Brevo Emails: Trigger a test email from your backend API",
    "Supabase: Verify database queries work in production logs",
    "Sentry: Trigger a test error in browser console"
)

foreach ($test in $validationTests) {
    Write-Host "  $test" -ForegroundColor White
}

# Step 6: Report validation issues
if ($validationIssues.Count -gt 0) {
    Write-Host "`nValidation Issues Found:" -ForegroundColor Red
    foreach ($issue in $validationIssues) {
        Write-Host "  WARNING: $issue" -ForegroundColor Yellow
    }
    Write-Host "`nPlease resolve these issues before proceeding with production deployment." -ForegroundColor Red
} else {
    Write-Host "`nEnvironment validation passed!" -ForegroundColor Green
}

# Step 7: Next actions summary
Write-Host "`nNext Actions:" -ForegroundColor Green
Write-Host "  1. Rotate secrets using the URLs above" -ForegroundColor White
Write-Host "  2. Update CI/CD environment variables" -ForegroundColor White
Write-Host "  3. Deploy to staging and run validation tests" -ForegroundColor White
Write-Host "  4. Deploy to production with monitoring" -ForegroundColor White

Write-Host "`nReady for production secret rotation!" -ForegroundColor Green

# Optional: Create rotation log
$logEntry = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    action = if ($ValidateOnly) { "validation" } else { "rotation_prepared" }
    environment = "production"
    issues_found = $validationIssues.Count
} | ConvertTo-Json

if (-not $DryRun) {
    $logFile = "logs/secret-rotation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
    $logEntry | Out-File -FilePath $logFile -Force
    Write-Host "`nLog saved to $logFile" -ForegroundColor Blue
}