# Prueba simple de Brands y Attributes
$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username": "admin", "password": "admin"}'
$headers = @{ "Authorization" = "Bearer $($authResponse.token)" }

Write-Host "=== OBTENIENDO DEPARTMENTS ===" -ForegroundColor Green
$departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers

Write-Host "Primer department estructura:" -ForegroundColor Yellow
$departments[0] | ConvertTo-Json -Depth 3

Write-Host "`n=== INTENTANDO POST BRAND ===" -ForegroundColor Green
try {
    $brandBody = '{"name": "Test Brand", "subdepartment_id": 1}'
    $brand = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method POST -Headers $headers -ContentType "application/json" -Body $brandBody
    Write-Host "Brand creada: ID $($brand.id)" -ForegroundColor Green
} catch {
    Write-Host "Error Brand: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== INTENTANDO POST ATTRIBUTE ===" -ForegroundColor Green
try {
    $attrBody = '{"name": "Test Attribute", "subdepartment_id": 1}'
    $attr = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method POST -Headers $headers -ContentType "application/json" -Body $attrBody
    Write-Host "Attribute creado: ID $($attr.id)" -ForegroundColor Green
} catch {
    Write-Host "Error Attribute: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== VERIFICANDO TOTALES ===" -ForegroundColor Green
$brands = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method GET -Headers $headers
$attributes = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method GET -Headers $headers
Write-Host "Brands: $($brands.Count)" -ForegroundColor White
Write-Host "Attributes: $($attributes.Count)" -ForegroundColor White