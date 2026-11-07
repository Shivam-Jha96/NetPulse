# NetPulse Wiki Publisher Script
# Automates publishing docs/wiki pages to https://github.com/Shivam-Jha96/NetPulse.wiki.git

param(
    [string]$WikiRemote = "https://github.com/Shivam-Jha96/NetPulse.wiki.git",
    [string]$WikiSourceDir = "$PSScriptRoot/../docs/wiki"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         NetPulse GitHub Wiki Publisher Engine            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$absSourceDir = (Resolve-Path $WikiSourceDir).Path
Write-Host "[*] Source Wiki Pages: $absSourceDir" -ForegroundColor Gray
Write-Host "[*] Remote Wiki URL:  $WikiRemote" -ForegroundColor Gray

# Check git remote accessibility
Write-Host ""
Write-Host "[*] Checking if GitHub Wiki backing repository is initialized..." -ForegroundColor Yellow
$lsResult = git ls-remote $WikiRemote 2>&1
$isInitialized = $LASTEXITCODE -eq 0

if (-not $isInitialized) {
    Write-Host ""
    Write-Host "[!] GitHub Wiki repository has not been initialized yet on GitHub." -ForegroundColor Red
    Write-Host "    GitHub requires creating the initial wiki page through the web UI once" -ForegroundColor Yellow
    Write-Host "    before the .wiki.git repository backend is provisioned by GitHub servers." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "--> Please open: https://github.com/Shivam-Jha96/NetPulse/wiki" -ForegroundColor Cyan
    Write-Host "--> Click 'Create the first page' and click 'Save Page'." -ForegroundColor Cyan
    exit 1
}

Write-Host "[OK] GitHub Wiki repository is ready!" -ForegroundColor Green

# Prepare staging folder
$tempWikiDir = Join-Path $env:TEMP "netpulse_wiki_publish"
if (Test-Path $tempWikiDir) {
    Remove-Item -Recurse -Force $tempWikiDir
}

Write-Host "[*] Cloning wiki repository into temporary workspace..." -ForegroundColor Gray
git clone $WikiRemote $tempWikiDir

Write-Host "[*] Copying all wiki pages and sidebar..." -ForegroundColor Gray
Copy-Item -Path "$absSourceDir\*" -Destination $tempWikiDir -Force -Recurse

Set-Location $tempWikiDir
git add .
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "[OK] Wiki is already up to date with docs/wiki." -ForegroundColor Green
} else {
    Write-Host "[*] Committing updated wiki documentation..." -ForegroundColor Gray
    git commit -m "docs: publish NetPulse end-user guide and technical wiki pages"
    Write-Host "[*] Pushing to GitHub Wiki..." -ForegroundColor Gray
    git push origin master
    Write-Host ""
    Write-Host "[OK] SUCCESS: NetPulse Wiki has been published to GitHub!" -ForegroundColor Green
    Write-Host "    View live at: https://github.com/Shivam-Jha96/NetPulse/wiki" -ForegroundColor Cyan
    Write-Host ""
}

Set-Location $PSScriptRoot
