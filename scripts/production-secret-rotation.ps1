# CalistaLife Production Secret Rotation Script
# Comprehensive secret rotation and validation for production launch

param(
    [switch]$DryRun = $false,
    [switch]$ValidateOnly = $false
)

Write-Host "🔐 CalistaLife Production Secret Rotation" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

if ($DryRun) {
    Write-Host "⚠️ DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
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
    "Stripe" = @{
        "url" = "https://dashboard.stripe.com/apikeys"
        "vars" = @("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PUBLISHABLE_KEY")
        "critical" = $false
    }
    "Twilio" = @{
        "url" = "https://console.twilio.com/us1/account/keys-credentials/api-keys"
        "vars" = @("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN")
        "critical" = $false
    }
}

# Step 1: Validate current environment files
Write-Host "`n📋 Step 1: Validating Environment Configuration" -ForegroundColor Cyan

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
    
    Write-Host "✓ Found: $file" -ForegroundColor Green
    
    # Check for placeholder patterns
    $content = Get-Content $file -Raw
    $placeholders = [regex]::Matches($content, '\{\{([^}]+)\}\}')
    
    if ($placeholders.Count -gt 0) {
        Write-Host "  📌 Found $($placeholders.Count) CI/CD placeholders:" -ForegroundColor Blue
        foreach ($match in $placeholders) {
            Write-Host "    - $($match.Groups[1].Value)" -ForegroundColor Gray
        }
    }
    
    # Check for hardcoded secrets (potential security issue)
    $suspiciousPatterns = @(
        'xkeysib-[a-f0-9]', 
        'sk_live_[a-zA-Z0-9]',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    )
    
    foreach ($pattern in $suspiciousPatterns) {
        if ($content -match $pattern) {
            $validationIssues += "Potential hardcoded secret in $file (pattern: $pattern)"
        }
    }
}

# Step 2: Check git status for secrets
Write-Host "`n🔍 Step 2: Git Repository Security Check" -ForegroundColor Cyan

$trackedSecrets = git ls-files | Where-Object {$_ -match '\.env' -and $_ -notmatch 'example|sample'}
if ($trackedSecrets) {
    foreach ($secret in $trackedSecrets) {
        $validationIssues += "Secret file tracked in git: $secret"
    }
} else {
    Write-Host "✓ No secret files tracked in git" -ForegroundColor Green
}

# Check for secrets in git history (sample check)
$gitSecretCheck = git log --all --grep="api[_-]?key" --oneline | Select-Object -First 5
if ($gitSecretCheck) {
    Write-Host "⚠️ Found potential secret-related commits in history:" -ForegroundColor Yellow
    $gitSecretCheck | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host "  Consider running BFG repo cleaner if needed" -ForegroundColor Yellow
}

# Step 3: Secret rotation checklist
Write-Host "`n🔄 Step 3: Secret Rotation Checklist" -ForegroundColor Cyan

foreach ($serviceName in $services.Keys) {
    $service = $services[$serviceName]
    $status = if ($service.critical) { "🔴 CRITICAL" } else { "🟡 OPTIONAL" }
    
    Write-Host "`n$status $serviceName" -ForegroundColor White
    Write-Host "  📱 URL: $($service.url)" -ForegroundColor Blue
    Write-Host "  🔧 Variables to update:" -ForegroundColor Gray
    foreach ($var in $service.vars) {
        Write-Host "    - $var" -ForegroundColor Gray
    }
}

# Step 4: CI/CD Integration Commands
Write-Host "`n🚀 Step 4: CI/CD Secret Injection Commands" -ForegroundColor Cyan

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
Write-Host "`n✅ Step 5: Post-Rotation Validation Tests" -ForegroundColor Cyan

$validationTests = @(
    "GA4 Events: Visit your site with ?debug_mode=true and check DebugView",
    "Brevo Emails: Trigger a test email from your backend API",
    "Supabase: Verify database queries work in production logs",
    "Sentry: Trigger a test error: setTimeout(() => { throw new Error('Test'); }, 0)"
)

foreach ($test in $validationTests) {
    Write-Host "  📋 $test" -ForegroundColor White
}

# Step 6: Report validation issues
if ($validationIssues.Count -gt 0) {
    Write-Host "`n❌ Validation Issues Found:" -ForegroundColor Red
    foreach ($issue in $validationIssues) {
        Write-Host "  ⚠️ $issue" -ForegroundColor Yellow
    }
    Write-Host "`nPlease resolve these issues before proceeding with production deployment." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n✅ Environment validation passed!" -ForegroundColor Green
}

# Step 7: Next actions summary
Write-Host "`n🎯 Next Actions:" -ForegroundColor Green
Write-Host "  1. Rotate secrets using the URLs above" -ForegroundColor White
Write-Host "  2. Update CI/CD environment variables" -ForegroundColor White
Write-Host "  3. Deploy to staging and run validation tests" -ForegroundColor White
Write-Host "  4. Deploy to production with monitoring" -ForegroundColor White

Write-Host "`n🚀 Ready for production secret rotation!" -ForegroundColor Green

# Optional: Create rotation log
$logEntry = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    action = if ($ValidateOnly) { "validation" } else { "rotation_prepared" }
    environment = "production"
    issues_found = $validationIssues.Count
} | ConvertTo-Json

if (-not $DryRun) {
    $logEntry | Out-File -FilePath "logs/secret-rotation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log" -Force
    Write-Host "`n📝 Log saved to logs/secret-rotation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log" -ForegroundColor Blue
}