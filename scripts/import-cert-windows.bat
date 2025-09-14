@echo off
REM Wrapper para ejecutar el script PowerShell que importa el certificado en el almacén LocalMachine\Root
set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%import-cert-windows.ps1

REM Ejecutar PowerShell (pwsh si está disponible, fallback a powershell)
where pwsh >nul 2>&1
if %errorlevel%==0 (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
)
