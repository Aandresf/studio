# Script para probar todos los endpoints del backend Rust
# test-endpoints.ps1

param(
    [string]$BaseUrl = "http://127.0.0.1:8080",
    [switch]$Verbose
)

# Colores para output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Info = "Cyan"
    Warning = "Yellow"
}

function Write-ColorOutput {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200,
        [switch]$RequiresAuth = $false
    )
    
    Write-ColorOutput "`n🔍 Probando: $Description" $Colors.Info
    Write-ColorOutput "   $Method $Url" "Gray"
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        if ($Verbose) {
            Write-ColorOutput "   Headers: $($Headers | ConvertTo-Json -Compress)" "Gray"
            if ($Body) { Write-ColorOutput "   Body: $Body" "Gray" }
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-ColorOutput "   ✅ ÉXITO ($($response.StatusCode))" $Colors.Success
            if ($Verbose -and $response.Content) {
                $content = $response.Content
                if ($content.Length -gt 200) { $content = $content.Substring(0, 200) + "..." }
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

function Test-Login {
    param([string]$BaseUrl)
    
    Write-ColorOutput "`n🔐 === PRUEBAS DE AUTENTICACIÓN ===" $Colors.Info
    
    $loginBody = @{
        username = "admin"
        password = "admin"
    } | ConvertTo-Json
    
    $loginResult = Test-Endpoint -Method "POST" -Url "$BaseUrl/api/auth/login" -Description "Login con admin/admin" -Body $loginBody
    
    if ($loginResult.Success -and $loginResult.Content) {
        try {
            $authResponse = $loginResult.Content | ConvertFrom-Json
            if ($authResponse.token) {
                Write-ColorOutput "   🎯 Token obtenido exitosamente" $Colors.Success
                return $authResponse.token
            }
        } catch {
            Write-ColorOutput "   ⚠️ Respuesta de login no es JSON válido" $Colors.Warning
        }
    }
    
    return $null
}

function Main {
    Write-ColorOutput "🚀 INICIANDO PRUEBAS DE ENDPOINTS DEL BACKEND RUST" $Colors.Info
    Write-ColorOutput "Base URL: $BaseUrl" $Colors.Info
    Write-ColorOutput "Timestamp: $(Get-Date)" $Colors.Info
    
    $results = @()
    
    # === ENDPOINTS PÚBLICOS ===
    Write-ColorOutput "`n📋 === ENDPOINTS PÚBLICOS ===" $Colors.Info
    
    $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/health" -Description "Health Check"
    $results += Test-Endpoint -Method "POST" -Url "$BaseUrl/api/auth/verify" -Description "Verificar Token (sin token)" -ExpectedStatus 400
    
    # === AUTENTICACIÓN ===
    $authToken = Test-Login -BaseUrl $BaseUrl
    
    if ($authToken) {
        $authHeaders = @{
            "Authorization" = "Bearer $authToken"
        }
        
        # === ENDPOINTS AUTENTICADOS ===
        Write-ColorOutput "`n🔐 === ENDPOINTS CON AUTENTICACIÓN ===" $Colors.Info
        
        # Auth endpoints
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/auth/status" -Description "Auth Status" -Headers $authHeaders
        $results += Test-Endpoint -Method "POST" -Url "$BaseUrl/api/auth/logout" -Description "Logout" -Headers $authHeaders
        
        # Products endpoints
        Write-ColorOutput "`n📦 === PRODUCTOS ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/products" -Description "Listar Productos" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/products/count" -Description "Contar Productos" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/products/999" -Description "Producto inexistente" -Headers $authHeaders -ExpectedStatus 404
        
        # Sales endpoints
        Write-ColorOutput "`n💰 === VENTAS ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/sales" -Description "Listar Ventas" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/sales/count" -Description "Contar Ventas" -Headers $authHeaders
        
        # Purchases endpoints
        Write-ColorOutput "`n🛒 === COMPRAS ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/purchases" -Description "Listar Compras" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/purchases/count" -Description "Contar Compras" -Headers $authHeaders
        
        # Inventory endpoints
        Write-ColorOutput "`n📊 === INVENTARIO ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/inventory" -Description "Listar Inventario" -Headers $authHeaders
        
        # Users endpoints
        Write-ColorOutput "`n👥 === USUARIOS ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/users" -Description "Listar Usuarios" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/users/count" -Description "Contar Usuarios" -Headers $authHeaders
        
        # Customers endpoints
        Write-ColorOutput "`n🤝 === CLIENTES ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/customers" -Description "Listar Clientes" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/customers/count" -Description "Contar Clientes" -Headers $authHeaders
        
        # Suppliers endpoints
        Write-ColorOutput "`n🏭 === PROVEEDORES ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/suppliers" -Description "Listar Proveedores" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/suppliers/count" -Description "Contar Proveedores" -Headers $authHeaders
        
        # Dashboard endpoints
        Write-ColorOutput "`n📈 === DASHBOARD ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/dashboard/summary" -Description "Resumen Dashboard" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/dashboard/sales" -Description "Ventas Dashboard" -Headers $authHeaders
        
        # Reports endpoints
        Write-ColorOutput "`n📋 === REPORTES ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/reports/sales" -Description "Reporte de Ventas" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/reports/products" -Description "Reporte de Productos" -Headers $authHeaders
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/reports/inventory" -Description "Reporte de Inventario" -Headers $authHeaders
        
        # Settings endpoints
        Write-ColorOutput "`n⚙️ === CONFIGURACIÓN ===" $Colors.Info
        $results += Test-Endpoint -Method "GET" -Url "$BaseUrl/api/settings" -Description "Listar Configuraciones" -Headers $authHeaders
        
        # Departments & Brands
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
    $totalTests = $results.Count
    $successfulTests = ($results | Where-Object { $_.Success }).Count
    $failedTests = $totalTests - $successfulTests
    
    Write-ColorOutput "Total de pruebas: $totalTests" $Colors.Info
    Write-ColorOutput "Exitosas: $successfulTests" $Colors.Success
    Write-ColorOutput "Fallidas: $failedTests" $(if ($failedTests -eq 0) { $Colors.Success } else { $Colors.Error })
    Write-ColorOutput "Tasa de éxito: $([math]::Round(($successfulTests / $totalTests) * 100, 1))%" $Colors.Info
    
    if ($failedTests -gt 0) {
        Write-ColorOutput "`n❌ PRUEBAS FALLIDAS:" $Colors.Error
        $results | Where-Object { -not $_.Success } | ForEach-Object {
            Write-ColorOutput "   - $($_.StatusCode): $($_.Content)" $Colors.Error
        }
    }
    
    Write-ColorOutput "`n✅ Pruebas completadas!" $Colors.Success
}

# Ejecutar el script principal
Main