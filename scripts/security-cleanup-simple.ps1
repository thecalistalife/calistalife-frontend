# TheCalista Security Cleanup Script
# Removes committed secrets and prepares for secure CI/CD deployment

Write-Host "TheCalista Security Cleanup Started" -ForegroundColor Green

# Step 1: Check current secret status
Write-Host "`nChecking current secret exposure..." -ForegroundColor Yellow

$secretFiles = @(
    ".env", 
    "backend\.env", 
    "frontend\.env", 
    ".env.sentry-build-plugin"
)

foreach ($file in $secretFiles) {
    if (Test-Path $file) {
        Write-Host "FOUND: $file (contains secrets)" -ForegroundColor Red
    } else {
        Write-Host "SAFE: $file (not found)" -ForegroundColor Green
    }
}

# Step 2: Create backup of current secrets for manual rotation
Write-Host "`nCreating backup for key rotation..." -ForegroundColor Yellow

$backupDir = "secrets-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

foreach ($file in $secretFiles) {
    if (Test-Path $file) {
        Copy-Item $file "$backupDir\" -Force
        Write-Host "Backed up: $file" -ForegroundColor Blue
    }
}

# Step 3: Remove secrets from git tracking (but keep local files for now)
Write-Host "`nRemoving secrets from git tracking..." -ForegroundColor Yellow

foreach ($file in $secretFiles) {
    if (Test-Path $file) {
        git rm --cached $file 2>$null
        if ($?) {
            Write-Host "Removed from git: $file" -ForegroundColor Green
        }
    }
}

# Step 4: Display rotation checklist
Write-Host "`nSECRET ROTATION REQUIRED - Complete these steps:" -ForegroundColor Red
Write-Host "   1. Brevo API Key: Go to https://app.brevo.com/settings/keys/api" -ForegroundColor White
Write-Host "   2. Supabase Keys: Go to https://supabase.com/dashboard/project/mrshlwfzkikpdycybqzi/settings/api" -ForegroundColor White
Write-Host "   3. Google OAuth: Go to https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "   4. Sentry Token: Go to https://sentry.io/settings/calista-44/auth-tokens/" -ForegroundColor White

# Step 5: Display CI/CD injection commands
Write-Host "`nCI/CD SECRET INJECTION COMMANDS:" -ForegroundColor Green
Write-Host "   For Vercel:" -ForegroundColor Cyan
Write-Host "   vercel env add VITE_SENTRY_DSN production" -ForegroundColor White
Write-Host "   vercel env add SUPABASE_SERVICE_ROLE_KEY production" -ForegroundColor White
Write-Host "   vercel env add BREVO_API_KEY production" -ForegroundColor White
Write-Host "   vercel env add VITE_GA4_MEASUREMENT_ID production" -ForegroundColor White

Write-Host "`n   For GitHub Actions:" -ForegroundColor Cyan
Write-Host "   gh secret set VITE_SENTRY_DSN" -ForegroundColor White
Write-Host "   gh secret set SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host "   gh secret set BREVO_API_KEY" -ForegroundColor White
Write-Host "   gh secret set VITE_GA4_MEASUREMENT_ID" -ForegroundColor White

# Step 6: Display validation checklist
Write-Host "`nVALIDATION CHECKLIST:" -ForegroundColor Green
Write-Host "   - Rotate all secrets using links above" -ForegroundColor White
Write-Host "   - Inject new secrets into CI/CD platform" -ForegroundColor White
Write-Host "   - Test GA4 events in DebugView" -ForegroundColor White
Write-Host "   - Test Brevo transactional emails" -ForegroundColor White
Write-Host "   - Test Supabase connection in staging" -ForegroundColor White
Write-Host "   - Test Sentry error capture" -ForegroundColor White

Write-Host "`nSecurity cleanup complete! Check backup folder: $backupDir" -ForegroundColor Green
Write-Host "IMPORTANT: Complete secret rotation before deploying to production!" -ForegroundColor Yellow