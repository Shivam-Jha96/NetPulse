[CmdletBinding()]
param(
    [string]$SubjectName = "NetPulse Open Source Diagnostics",
    [switch]$Force
)

Write-Host "[*] NetPulse Authenticode Certificate Setup" -ForegroundColor Cyan

# Check if a certificate already exists in CurrentUser\My
$existing = Get-ChildItem -Path Cert:\CurrentUser\My -ErrorAction SilentlyContinue | Where-Object {
    $_.Subject -like "*$SubjectName*"
}

if ($existing -and -not $Force) {
    $cert = $existing[0]
    Write-Host "[+] Found existing code signing certificate: $($cert.Thumbprint)" -ForegroundColor Green
    return $cert
}

Write-Host "[*] Creating Code Signing certificate in Cert:\CurrentUser\My..." -ForegroundColor Yellow

$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=$SubjectName, O=NetPulse Core Engineering" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -FriendlyName "NetPulse Dev Code Signing" `
    -KeyUsage DigitalSignature `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -HashAlgorithm SHA256 `
    -NotAfter (Get-Date).AddYears(3)

Write-Host "[+] Certificate ready for signing!" -ForegroundColor Green
Write-Host "    Thumbprint: $($cert.Thumbprint)" -ForegroundColor Cyan
Write-Host "    Subject:    $($cert.Subject)" -ForegroundColor White

return $cert
