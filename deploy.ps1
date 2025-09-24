# deploy.ps1
param(
  [string]$FrontendDir = "C:\Users\khara\OneDrive\Desktop\thecalista\frontend",
  [string]$BackendDir  = "C:\Users\khara\OneDrive\Desktop\thecalista\backend",
  [string]$Branch      = "main"
)

function Push-Repo($path, $msg) {
  if (-not (Test-Path $path)) {
    Write-Host "❌ Path not found: $path" -ForegroundColor Red
    return
  }
  Push-Location $path
  git add -A
  $status = git status --porcelain
  if ($status) {
    git commit -m $msg
    git push origin $Branch
    Write-Host "✅ Pushed $path"
  } else {
    Write-Host "ℹ️ No changes to commit in $path"
  }
  Pop-Location
}

Write-Host "🚀 Deploy started..."
Push-Repo $FrontendDir "Auto: update frontend"
Push-Repo $BackendDir  "Auto: update backend"
Write-Host "🚀 Deploy finished. Hosting services (Netlify/Render) will auto-deploy on push."
