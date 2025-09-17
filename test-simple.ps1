# Script para probar endpoints del backend Rust
$BaseUrl = "http://127.0.0.1:8080"
$Username = "admin"
$Password = "admin"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

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
        
        Write-ColorOutput "Intentando autenticacion..." "Cyan"
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        
        if ($response.token) {
            Write-ColorOutput "Autenticacion exitosa" "Green"
            return $response.token
        } else {
            Write-ColorOutput "Respuesta sin token" "Red"
            return $null
        }
    }
    catch {
        Write-ColorOutput "Error de autenticacion: $($_.Exception.Message)" "Red"
        return $null
    }
}

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-ColorOutput "`nProbando: $Description" "White"
    Write-ColorOutput "$Method $Url" "Gray"
    
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
            Write-ColorOutput "EXITO ($($response.StatusCode))" "Green"
            return @{ Success = $true; StatusCode = $response.StatusCode }
        } else {
            Write-ColorOutput "CODIGO INESPERADO ($($response.StatusCode))" "Yellow"
            return @{ Success = $false; StatusCode = $response.StatusCode }
        }
    }
    catch {
        $statusCode = "N/A"
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-ColorOutput "EXITO ($statusCode)" "Green"
            return @{ Success = $true; StatusCode = $statusCode }
        } else {
            Write-ColorOutput "ERROR ($statusCode): $($_.Exception.Message)" "Red"
            return @{ Success = $false; StatusCode = $statusCode }
        }
    }
}

# Inicio del script
Write-ColorOutput "=== INICIANDO PRUEBAS DE ENDPOINTS ===" "Cyan"
Write-ColorOutput "Servidor: $BaseUrl" "Gray"

$results = @()

# Health check
Write-ColorOutput "`n=== HEALTH CHECK ===" "Cyan"
$results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/health" -Description "Health Check"

# Autenticacion
$token = Get-AuthToken -BaseUrl $BaseUrl -Username $Username -Password $Password

if ($token) {
    $authHeaders = @{
        "Authorization" = "Bearer $token"
    }
    
    # Pruebas con autenticacion
    Write-ColorOutput "`n=== USUARIOS ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/users" -Description "Listar Usuarios" -Headers $authHeaders
    
    Write-ColorOutput "`n=== PRODUCTOS ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/products" -Description "Listar Productos" -Headers $authHeaders
    
    Write-ColorOutput "`n=== VENTAS ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/sales" -Description "Listar Ventas" -Headers $authHeaders
    
    Write-ColorOutput "`n=== INVENTARIO ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/inventory/movements" -Description "Movimientos de Inventario" -Headers $authHeaders
    
    Write-ColorOutput "`n=== CLIENTES ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/customers" -Description "Listar Clientes" -Headers $authHeaders
    
    Write-ColorOutput "`n=== PROVEEDORES ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/suppliers" -Description "Listar Proveedores" -Headers $authHeaders
    
    Write-ColorOutput "`n=== DASHBOARD ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/dashboard/stats" -Description "Estadisticas Dashboard" -Headers $authHeaders
    
    Write-ColorOutput "`n=== REPORTES ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/reports/inventory" -Description "Reporte de Inventario" -Headers $authHeaders
    
    Write-ColorOutput "`n=== CONFIGURACION ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/settings" -Description "Configuracion" -Headers $authHeaders
    
    Write-ColorOutput "`n=== CATALOGO ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/departments" -Description "Listar Departamentos" -Headers $authHeaders
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/brands" -Description "Listar Marcas" -Headers $authHeaders
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/attributes" -Description "Listar Atributos" -Headers $authHeaders
    
} else {
    Write-ColorOutput "`nNo se pudo obtener token. Saltando pruebas autenticadas." "Red"
    
    # Probar sin autenticacion (debe dar 401)
    Write-ColorOutput "`n=== SIN AUTENTICACION ===" "Cyan"
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/products" -Description "Productos sin auth" -ExpectedStatus 401
}

# Resumen
Write-ColorOutput "`n=== RESUMEN ===" "Cyan"
$successful = $results | Where-Object { $_.Success -eq $true }
$failed = $results | Where-Object { $_.Success -eq $false }

Write-ColorOutput "Total: $($results.Count)" "White"
Write-ColorOutput "Exitosas: $($successful.Count)" "Green"
Write-ColorOutput "Fallidas: $($failed.Count)" "Red"

Write-ColorOutput "`n=== COMPLETADO ===" "Cyan"