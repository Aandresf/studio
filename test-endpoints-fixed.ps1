# Script para probar todos los endpoints del backend Rust
# Configuración
$BaseUrl = "http://127.0.0.1:8080"
$Username = "admin"
$Password = "admin"

# Configuración de colores para output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
}

# Función para output con colores
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Función para obtener token de autenticación
function Get-AuthToken {
    param(
        [string]$BaseUrl,
        [string]$Username,
        [string]$Password
    )
    
    try {
        $loginData = @{
            username = $Username
            password = $Password
        } | ConvertTo-Json
        
        Write-ColorOutput "`n🔐 Intentando autenticación..." $Colors.Info
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        
        if ($response.token) {
            Write-ColorOutput "   ✅ Autenticación exitosa" $Colors.Success
            return $response.token
        } else {
            Write-ColorOutput "   ❌ Respuesta sin token" $Colors.Error
            return $null
        }
    }
    catch {
        Write-ColorOutput "   ❌ Error de autenticación: $($_.Exception.Message)" $Colors.Error
        return $null
    }
}

# Función para probar endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200,
        [switch]$RequiresAuth
    )
    
    Write-ColorOutput "`n  🔍 Probando: $Description" "White"
    Write-ColorOutput "      $Method $Url" "Gray"
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-ColorOutput "   ✅ ÉXITO ($($response.StatusCode))" $Colors.Success
            if ($response.Content.Length -lt 500) {
                $content = $response.Content | ConvertFrom-Json | ConvertTo-Json -Compress
                Write-ColorOutput "   Respuesta: $content" "Gray"
            }
            return @{ Success = $true; StatusCode = $response.StatusCode; Content = $response.Content }
        } else {
            Write-ColorOutput "   ⚠️ CÓDIGO INESPERADO ($($response.StatusCode)) - Esperado: $ExpectedStatus" $Colors.Warning
            return @{ Success = $false; StatusCode = $response.StatusCode; Content = $response.Content }
        }
    }
    catch {
        $statusCode = "N/A"
        $errorMsg = $_.Exception.Message
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($RequiresAuth -and $statusCode -eq 401) {
            Write-ColorOutput "   🔒 REQUIERE AUTENTICACIÓN ($statusCode)" $Colors.Warning
            return @{ Success = $true; StatusCode = $statusCode; Content = "Requires Auth"; RequiresAuth = $true }
        } elseif ($statusCode -eq $ExpectedStatus) {
            Write-ColorOutput "   ✅ ÉXITO ($statusCode)" $Colors.Success
            return @{ Success = $true; StatusCode = $statusCode; Content = $errorMsg }
        } else {
            Write-ColorOutput "   ❌ ERROR ($statusCode): $errorMsg" $Colors.Error
            return @{ Success = $false; StatusCode = $statusCode; Content = $errorMsg }
        }
    }
}

# === INICIO DEL SCRIPT ===
Write-ColorOutput "🚀 === INICIANDO PRUEBAS DE ENDPOINTS ===" $Colors.Info
Write-ColorOutput "Servidor: $BaseUrl" "Gray"

$results = @()

# Probar endpoint de salud primero
Write-ColorOutput "`n❤️ === HEALTH CHECK ===" $Colors.Info
$results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/health" -Description "Health Check"

# Obtener token de autenticación
$token = Get-AuthToken -BaseUrl $BaseUrl -Username $Username -Password $Password

if ($token) {
    $authHeaders = @{
        "Authorization" = "Bearer $token"
    }
    
    # === ENDPOINTS AUTENTICADOS ===
    
    # USUARIOS
    Write-ColorOutput "`n👥 === USUARIOS ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/users" -Description "Listar Usuarios" -Headers $authHeaders
    
    # PRODUCTOS  
    Write-ColorOutput "`n📦 === PRODUCTOS ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/products" -Description "Listar Productos" -Headers $authHeaders
    
    # VENTAS
    Write-ColorOutput "`n💰 === VENTAS ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/sales" -Description "Listar Ventas" -Headers $authHeaders
    
    # INVENTARIO
    Write-ColorOutput "`n📋 === INVENTARIO ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/inventory/movements" -Description "Movimientos de Inventario" -Headers $authHeaders
    
    # CLIENTES
    Write-ColorOutput "`n👤 === CLIENTES ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/customers" -Description "Listar Clientes" -Headers $authHeaders
    
    # PROVEEDORES
    Write-ColorOutput "`n🏢 === PROVEEDORES ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/suppliers" -Description "Listar Proveedores" -Headers $authHeaders
    
    # DASHBOARD
    Write-ColorOutput "`n📊 === DASHBOARD ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/dashboard/stats" -Description "Estadísticas Dashboard" -Headers $authHeaders
    
    # REPORTES
    Write-ColorOutput "`n📈 === REPORTES ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/reports/inventory" -Description "Reporte de Inventario" -Headers $authHeaders
    
    # CONFIGURACIÓN
    Write-ColorOutput "`n⚙️ === CONFIGURACIÓN ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/settings" -Description "Configuración" -Headers $authHeaders
    
    # CATÁLOGO
    Write-ColorOutput "`n🏷️ === CATÁLOGO ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/departments" -Description "Listar Departamentos" -Headers $authHeaders
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/brands" -Description "Listar Marcas" -Headers $authHeaders
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/attributes" -Description "Listar Atributos" -Headers $authHeaders
    
} else {
    Write-ColorOutput "`n❌ No se pudo obtener token de autenticación. Saltando pruebas autenticadas." $Colors.Error
    
    # Probar algunos endpoints sin auth para ver el error
    Write-ColorOutput "`n🔒 === ENDPOINTS SIN AUTENTICACIÓN (esperando error 401) ===" $Colors.Info
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/products" -Description "Productos sin auth" -ExpectedStatus 401 -RequiresAuth
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/users" -Description "Usuarios sin auth" -ExpectedStatus 401 -RequiresAuth
}

# === RESUMEN ===
Write-ColorOutput "`n📊 === RESUMEN DE PRUEBAS ===" $Colors.Info

$successful = $results | Where-Object { $_.Success -eq $true }
$failed = $results | Where-Object { $_.Success -eq $false }

Write-ColorOutput "`nTotal de pruebas: $($results.Count)" "White"
Write-ColorOutput "✅ Exitosas: $($successful.Count)" $Colors.Success
Write-ColorOutput "❌ Fallidas: $($failed.Count)" $Colors.Error

if ($failed.Count -gt 0) {
    Write-ColorOutput "`n⚠️ Endpoints que fallaron:" $Colors.Warning
    foreach ($fail in $failed) {
        Write-ColorOutput "   - Status: $($fail.StatusCode)" $Colors.Error
    }
}

Write-ColorOutput "`n🎉 === PRUEBAS COMPLETADAS ===" $Colors.Info