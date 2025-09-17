# Pruebas CRUD finales
Write-Host "=== PRUEBAS CRUD COMPLETAS ===" -ForegroundColor Green

# Auth
$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username": "admin", "password": "admin"}'
$headers = @{ "Authorization" = "Bearer $($authResponse.token)" }
Write-Host "Token obtenido" -ForegroundColor Green

Write-Host "`n=== DEPARTMENTS ===" -ForegroundColor Cyan
$departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
Write-Host "GET Departments: $($departments.Count) registros" -ForegroundColor Green

$deptBody = '{"name": "Final Test Dept", "abbreviation": "FTD"}'
$createdDept = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method POST -Headers $headers -ContentType "application/json" -Body $deptBody
Write-Host "POST Department exitoso: ID $($createdDept.id)" -ForegroundColor Green

Write-Host "`n=== CUSTOMERS ===" -ForegroundColor Cyan
$customers = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method GET -Headers $headers
Write-Host "GET Customers: $($customers.Count) registros" -ForegroundColor Green

$customerBody = '{"name": "Final Test Customer", "email": "final@test.com", "phone": "111222333", "address": "Final Address", "rfc": "FINAL123", "notes": "Final notes"}'
$createdCustomer = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method POST -Headers $headers -ContentType "application/json" -Body $customerBody
Write-Host "POST Customer exitoso: ID $($createdCustomer.id)" -ForegroundColor Green

Write-Host "`n=== BRANDS ===" -ForegroundColor Cyan
$brands = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method GET -Headers $headers
Write-Host "GET Brands: $($brands.Count) registros" -ForegroundColor Green

Write-Host "`n=== ATTRIBUTES ===" -ForegroundColor Cyan
$attributes = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method GET -Headers $headers
Write-Host "GET Attributes: $($attributes.Count) registros" -ForegroundColor Green

Write-Host "`n=== TOTALES FINALES ===" -ForegroundColor Yellow
$finalDepts = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
$finalCustomers = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method GET -Headers $headers
Write-Host "Departments: $($finalDepts.Count)" -ForegroundColor White
Write-Host "Customers: $($finalCustomers.Count)" -ForegroundColor White

Write-Host "`nPRUEBAS CRUD COMPLETADAS" -ForegroundColor Green