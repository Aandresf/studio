# Pruebas CRUD completas corregidas
Write-Host "=== PRUEBAS CRUD COMPLETAS ===" -ForegroundColor Green

# Autenticación
$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username": "admin", "password": "admin"}'
$headers = @{ "Authorization" = "Bearer $($authResponse.token)" }
Write-Host "✓ Autenticación exitosa" -ForegroundColor Green

Write-Host "`n=== 1. DEPARTMENTS CRUD ===" -ForegroundColor Cyan

# READ
$departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
Write-Host "✓ GET Departments: $($departments.Count) registros" -ForegroundColor Green

# CREATE
$deptBody = '{"name": "CRUD Test Dept", "abbreviation": "CTD"}'
$createdDept = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method POST -Headers $headers -ContentType "application/json" -Body $deptBody
Write-Host "✓ POST Department: ID $($createdDept.id) - $($createdDept.name)" -ForegroundColor Green

# READ specific
$specificDept = Invoke-RestMethod -Uri "http://localhost:8080/api/departments/$($createdDept.id)" -Method GET -Headers $headers
Write-Host "✓ GET Specific Department: $($specificDept.name)" -ForegroundColor Green

Write-Host "`n=== 2. CUSTOMERS CRUD ===" -ForegroundColor Cyan

# READ
$customers = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method GET -Headers $headers
Write-Host "✓ GET Customers: $($customers.Count) registros" -ForegroundColor Green

# CREATE
$customerBody = '{"name": "CRUD Test Customer", "email": "crud@test.com", "phone": "987654321", "address": "CRUD Test Address", "rfc": "CRUD123", "notes": "CRUD test notes"}'
$createdCustomer = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method POST -Headers $headers -ContentType "application/json" -Body $customerBody
Write-Host "✓ POST Customer: ID $($createdCustomer.id) - $($createdCustomer.name)" -ForegroundColor Green

Write-Host "`n=== 3. BRANDS CRUD ===" -ForegroundColor Cyan

# READ
$brands = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method GET -Headers $headers
Write-Host "✓ GET Brands: $($brands.Count) registros" -ForegroundColor Green

Write-Host "`n=== 4. ATTRIBUTES CRUD ===" -ForegroundColor Cyan

# READ
$attributes = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method GET -Headers $headers
Write-Host "✓ GET Attributes: $($attributes.Count) registros" -ForegroundColor Green

Write-Host "`n=== VERIFICACIÓN FINAL ===" -ForegroundColor Yellow

# Verificar totales finales
$finalDepts = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
$finalCustomers = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method GET -Headers $headers
$finalBrands = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method GET -Headers $headers
$finalAttribs = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method GET -Headers $headers

Write-Host "TOTALES FINALES:" -ForegroundColor Green
Write-Host "  Departments: $($finalDepts.Count)" -ForegroundColor White
Write-Host "  Customers: $($finalCustomers.Count)" -ForegroundColor White
Write-Host "  Brands: $($finalBrands.Count)" -ForegroundColor White
Write-Host "  Attributes: $($finalAttribs.Count)" -ForegroundColor White

Write-Host "`n✅ PRUEBAS CRUD COMPLETADAS EXITOSAMENTE" -ForegroundColor Green