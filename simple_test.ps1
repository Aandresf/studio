Write-Host "=== PROBANDO ENDPOINTS ===" -ForegroundColor Green

# Autenticación
$loginBody = '{"username": "admin", "password": "admin"}'
$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $authResponse.token
Write-Host "Token obtenido" -ForegroundColor Green

$headers = @{ "Authorization" = "Bearer $token" }

# Departments
Write-Host "Probando departments..." -ForegroundColor Yellow
$departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
Write-Host "Departments: $($departments.Count) registros" -ForegroundColor Green

# Brands
Write-Host "Probando brands..." -ForegroundColor Yellow
$brands = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method GET -Headers $headers
Write-Host "Brands: $($brands.Count) registros" -ForegroundColor Green

# Customers
Write-Host "Probando customers..." -ForegroundColor Yellow
$customers = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method GET -Headers $headers
Write-Host "Customers: $($customers.Count) registros" -ForegroundColor Green

# Attributes
Write-Host "Probando attributes..." -ForegroundColor Yellow
$attributes = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method GET -Headers $headers
Write-Host "Attributes: $($attributes.Count) registros" -ForegroundColor Green

Write-Host "Todas las pruebas completadas" -ForegroundColor Blue