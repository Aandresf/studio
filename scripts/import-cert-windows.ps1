<#
Importa src-backend/data/.certs/cert.pem en Trusted Root Certification Authorities en Windows.
Se solicita elevación si no se ejecuta como administrador.
#>

param(
    [string]$CertPath = "src-backend\data\.certs\cert.pem"
)

function Test-IsAdmin {
    $current = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdmin)) {
    Write-Host "Se requiere elevación. Reiniciando con privilegios de administrador..."
    # Intentar iniciar pwsh (PowerShell Core). Si falla, intentar powershell.
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -CertPath `"$CertPath`""
    try {
        Start-Process -FilePath pwsh -ArgumentList $argList -Verb RunAs -ErrorAction Stop
    } catch {
        try {
            Start-Process -FilePath powershell -ArgumentList $argList -Verb RunAs -ErrorAction Stop
        } catch {
            Write-Error "No se encontró pwsh ni powershell para relanzar con elevación."
            Exit 1
        }
    }
    Exit
}

$fullPath = Resolve-Path $CertPath -ErrorAction SilentlyContinue
if (-not $fullPath) {
    Write-Error "No se encontró el certificado en la ruta especificada: $CertPath"
    Exit 1
}

$certFile = $fullPath.Path
Write-Host "Importando certificado desde: $certFile"

try {
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certFile)
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store('Root','LocalMachine')
    $store.Open('ReadWrite')
    $store.Add($cert)
    $store.Close()
    Write-Host "Certificado importado en Trusted Root Certification Authorities (LocalMachine)."
    exit 0
} catch {
    Write-Error "Error importando el certificado: $_"
    exit 1
}
