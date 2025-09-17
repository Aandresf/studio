# Script para probar los endpoints del backend

# 1. Autenticación
Write-Host "=== AUTENTICACIÓN ===" -ForegroundColor Green
$loginBody = '{"username": "admin", "password": "admin"}'

try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $authResponse.token
    Write-Host "Autenticación exitosa" -ForegroundColor Green
    Write-Host "Token obtenido" -ForegroundColor Gray
} catch {
    Write-Host "Error en autenticación" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# 2. Probar Departments
Write-Host "`n=== DEPARTMENTS ===" -ForegroundColor Green
try {
    $departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
    Write-Host "Departments: $($departments.Count) registros encontrados" -ForegroundColor Green
    if ($departments.Count -gt 0) {
        Write-Host "Primer departamento: $($departments[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error en departments" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# 3. Probar Brands
Write-Host "`n=== BRANDS ===" -ForegroundColor Green
try {
    $brands = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method GET -Headers $headers
    Write-Host "Brands: $($brands.Count) registros encontrados" -ForegroundColor Green
    if ($brands.Count -gt 0) {
        Write-Host "Primera marca: $($brands[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error en brands" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# 4. Probar Customers
Write-Host "`n=== CUSTOMERS ===" -ForegroundColor Green
try {
    $customers = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method GET -Headers $headers
    Write-Host "Customers: $($customers.Count) registros encontrados" -ForegroundColor Green
    if ($customers.Count -gt 0) {
        Write-Host "Primer cliente: $($customers[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error en customers" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# 5. Probar Attributes
Write-Host "`n=== ATTRIBUTES ===" -ForegroundColor Green
try {
    $attributes = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method GET -Headers $headers
    Write-Host "Attributes: $($attributes.Count) registros encontrados" -ForegroundColor Green
    if ($attributes.Count -gt 0) {
        Write-Host "Primer atributo: $($attributes[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error en attributes" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n=== RESUMEN COMPLETADO ===" -ForegroundColor Yellow