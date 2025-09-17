# Pruebas CRUD completas
Write-Host "=== PRUEBAS CRUD COMPLETAS ===" -ForegroundColor Green

# Autenticación
$loginBody = '{"username": "admin", "password": "admin"}'
$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $authResponse.token
Write-Host "Token obtenido" -ForegroundColor Green

$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "`n=== DEPARTMENTS ===" -ForegroundColor Cyan

# READ Departments
Write-Host "Probando GET departments..." -ForegroundColor Yellow
$departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
Write-Host "GET Departments: $($departments.Count) registros" -ForegroundColor Green

# CREATE Department
Write-Host "Probando POST department..." -ForegroundColor Yellow
$newDeptBody = '{"name": "Departamento Test", "description": "Test description"}'
try {
    $createdDept = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method POST -Headers $headers -ContentType "application/json" -Body $newDeptBody
    Write-Host "POST Department exitoso - ID: $($createdDept.id)" -ForegroundColor Green
    $testDeptId = $createdDept.id
} catch {
    Write-Host "Error POST Department: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== BRANDS ===" -ForegroundColor Cyan

# READ Brands
Write-Host "Probando GET brands..." -ForegroundColor Yellow
$brands = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method GET -Headers $headers
Write-Host "GET Brands: $($brands.Count) registros" -ForegroundColor Green

Write-Host "`n=== CUSTOMERS ===" -ForegroundColor Cyan

# READ Customers
Write-Host "Probando GET customers..." -ForegroundColor Yellow
$customers = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method GET -Headers $headers
Write-Host "GET Customers: $($customers.Count) registros" -ForegroundColor Green

# CREATE Customer
Write-Host "Probando POST customer..." -ForegroundColor Yellow
$newCustomerBody = '{"name": "Cliente Test", "email": "test@test.com", "phone": "123456789", "address": "Test Address", "rfc": "TEST123", "notes": "Test notes"}'
try {
    $createdCustomer = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method POST -Headers $headers -ContentType "application/json" -Body $newCustomerBody
    Write-Host "POST Customer exitoso - ID: $($createdCustomer.id)" -ForegroundColor Green
    $testCustomerId = $createdCustomer.id
} catch {
    Write-Host "Error POST Customer: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ATTRIBUTES ===" -ForegroundColor Cyan

# READ Attributes
Write-Host "Probando GET attributes..." -ForegroundColor Yellow
$attributes = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method GET -Headers $headers
Write-Host "GET Attributes: $($attributes.Count) registros" -ForegroundColor Green

Write-Host "`nPruebas CRUD completadas" -ForegroundColor Blue