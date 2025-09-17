# Script para probar endpoints corregidos
Write-Host "=== Iniciando pruebas de endpoints ===" -ForegroundColor Green

# Funcion para hacer solicitudes HTTP
function Test-Endpoint {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [string]$ContentType = "application/json",
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$Description
    )
    
    Write-Host "`n--- $Description ---" -ForegroundColor Yellow
    Write-Host "URI: $Uri"
    Write-Host "Method: $Method"
    
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ContentType = $ContentType
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        Write-Host "Status: $($response.StatusCode) - SUCCESS" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Status: ERROR - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 1. Autenticacion para obtener token
Write-Host "=== 1. AUTENTICACION ===" -ForegroundColor Cyan
$loginResponse = Test-Endpoint -Uri "http://localhost:8080/api/auth/login" -Method "POST" -Body '{"username":"admin","password":"admin"}' -Description "Login Admin"

if ($loginResponse) {
    # Obtener token del login
    $loginData = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin"}' -UseBasicParsing
    $tokenData = $loginData.Content | ConvertFrom-Json
    $token = $tokenData.token
    $authHeaders = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "Token obtenido exitosamente" -ForegroundColor Green
    
    # 2. Probar endpoints de DEPARTMENTS (corregidos)
    Write-Host "`n=== 2. DEPARTMENTS ENDPOINTS ===" -ForegroundColor Cyan
    Test-Endpoint -Uri "http://localhost:8080/api/departments" -Headers $authHeaders -Description "Obtener todos los departamentos"
    Test-Endpoint -Uri "http://localhost:8080/api/departments/search?q=test" -Headers $authHeaders -Description "Buscar departamentos"
    Test-Endpoint -Uri "http://localhost:8080/api/departments/1" -Headers $authHeaders -Description "Obtener departamento por ID"
    Test-Endpoint -Uri "http://localhost:8080/api/departments/1/subdepartments" -Headers $authHeaders -Description "Obtener subdepartamentos"
    
    # 3. Probar endpoints de BRANDS (corregidos)
    Write-Host "`n=== 3. BRANDS ENDPOINTS ===" -ForegroundColor Cyan
    Test-Endpoint -Uri "http://localhost:8080/api/brands" -Headers $authHeaders -Description "Obtener todas las marcas"
    Test-Endpoint -Uri "http://localhost:8080/api/brands/search?q=test" -Headers $authHeaders -Description "Buscar marcas"
    Test-Endpoint -Uri "http://localhost:8080/api/brands/1" -Headers $authHeaders -Description "Obtener marca por ID"
    Test-Endpoint -Uri "http://localhost:8080/api/brands/by-subdepartment/1" -Headers $authHeaders -Description "Marcas por subdepartamento"
    
    # 4. Probar endpoints de CUSTOMERS (corregidos)
    Write-Host "`n=== 4. CUSTOMERS ENDPOINTS ===" -ForegroundColor Cyan
    Test-Endpoint -Uri "http://localhost:8080/api/customers" -Headers $authHeaders -Description "Obtener todos los clientes"
    Test-Endpoint -Uri "http://localhost:8080/api/customers/search?q=test" -Headers $authHeaders -Description "Buscar clientes"
    Test-Endpoint -Uri "http://localhost:8080/api/customers/1" -Headers $authHeaders -Description "Obtener cliente por ID"
    
    # 5. Probar endpoints de ATTRIBUTES (corregidos)
    Write-Host "`n=== 5. ATTRIBUTES ENDPOINTS ===" -ForegroundColor Cyan
    Test-Endpoint -Uri "http://localhost:8080/api/attributes" -Headers $authHeaders -Description "Obtener todos los atributos"
    Test-Endpoint -Uri "http://localhost:8080/api/attributes/search?q=test" -Headers $authHeaders -Description "Buscar atributos"
    Test-Endpoint -Uri "http://localhost:8080/api/attributes/1" -Headers $authHeaders -Description "Obtener atributo por ID"
    Test-Endpoint -Uri "http://localhost:8080/api/attributes/1/values" -Headers $authHeaders -Description "Valores de atributo"
    
    # 6. Probar endpoints de PRODUCTS (ya funcionaban)
    Write-Host "`n=== 6. PRODUCTS ENDPOINTS (REFERENCIA) ===" -ForegroundColor Cyan
    Test-Endpoint -Uri "http://localhost:8080/api/products" -Headers $authHeaders -Description "Obtener todos los productos"
    Test-Endpoint -Uri "http://localhost:8080/api/products/search?q=test" -Headers $authHeaders -Description "Buscar productos"
    
} else {
    Write-Host "ERROR: No se pudo autenticar. Abortando pruebas." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Pruebas completadas ===" -ForegroundColor Green