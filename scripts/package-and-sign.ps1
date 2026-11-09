<#
.SYNOPSIS
    Compiles NetPulse into a production NSIS installer (.exe) and signs it.
.DESCRIPTION
    Builds the production web bundle, compiles the Rust core via Tauri v2,
    packages the NSIS installer wizard, and signs the binary with Authenticode.
#>

[CmdletBinding()]
param(
    [switch]$SkipSign
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       NetPulse Production Installer Builder & Signer     " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Build frontend
Write-Host "`n[1/3] Building production React 19 frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend compilation failed."
    exit 1
}

# 2. Bundle NSIS Setup Wizard via Tauri
Write-Host "`n[2/3] Compiling Rust core and bundling NSIS Windows Installer..." -ForegroundColor Yellow
npx tauri build --bundles nsis
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tauri NSIS packaging failed."
    exit 1
}

# 3. Locate generated installer
$nsisDir = Join-Path $PSScriptRoot "..\src-tauri\target\release\bundle\nsis"
$installers = Get-ChildItem -Path $nsisDir -Filter "*.exe" -ErrorAction SilentlyContinue

if (-not $installers) {
    Write-Error "Could not locate generated NSIS installer in $nsisDir"
    exit 1
}

$installer = $installers[0]
Write-Host "`n[3/3] Generated Installer: $($installer.FullName)" -ForegroundColor Green

# 4. Sign with Authenticode if requested
if (-not $SkipSign) {
    Write-Host "`n[*] Signing installer with Authenticode certificate..." -ForegroundColor Yellow
    $certScript = Join-Path $PSScriptRoot "create-dev-cert.ps1"
    $cert = & $certScript
    
    if ($cert) {
        $sigResult = Set-AuthenticodeSignature -FilePath $installer.FullName -Certificate $cert -HashAlgorithm SHA256
        Write-Host "[+] Authenticode Signature applied to $($installer.Name)" -ForegroundColor Green
    } else {
        Write-Warning "Could not obtain code signing certificate; skipping signing."
    }
}

# 5. Output Summary
$hash = (Get-FileHash -Path $installer.FullName -Algorithm SHA256).Hash
$sizeMb = [math]::Round($installer.Length / 1MB, 2)

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "[+] INSTALLER PACKAGING COMPLETE!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "File:       $($installer.Name)" -ForegroundColor White
Write-Host "Size:       $sizeMb MB" -ForegroundColor White
Write-Host "Path:       $($installer.FullName)" -ForegroundColor Cyan
Write-Host "SHA256:     $hash" -ForegroundColor Yellow
Write-Host "==========================================================`n" -ForegroundColor Cyan
