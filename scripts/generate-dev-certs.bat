@echo off
REM Genera certificados de desarrollo autofirmados usando OpenSSL en Windows.
REM Coloca key.pem y cert.pem en src-backend/data/.certs

 setlocal enabledelayedexpansion
set ROOT_DIR=%~dp0..
set CERT_DIR=%~dp0..\src-backend\data\.certs
if not exist "%CERT_DIR%" mkdir "%CERT_DIR%"

 REM Allow using installed openssl in PATH or provide full path via OPENSSL env var
if defined OPENSSL (
  set OPENSSL_CMD=%OPENSSL%
) else (
  set OPENSSL_CMD=openssl
)

 echo Generating dev certs in %CERT_DIR%

 REM Generate a new key and self-signed cert valid 3650 days (10 years)
%OPENSSL_CMD% req -x509 -nodes -newkey rsa:2048 -keyout "%CERT_DIR%\key.pem" -out "%CERT_DIR%\cert.pem" -days 3650 -subj "/C=XX/ST=None/L=None/O=Dev/CN=localhost"

 echo Done. Certificates written to %CERT_DIR%
echo To trust the certificate in Windows, use mkcert or import cert.pem into Trusted Root Certification Authorities.
endlocal
