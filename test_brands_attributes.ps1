# Pruebas POST para Brands y Attributes
Write-Host "=== PRUEBAS POST BRANDS Y ATTRIBUTES ===" -ForegroundColor Green

# Auth
$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username": "admin", "password": "admin"}'
$headers = @{ "Authorization" = "Bearer $($authResponse.token)" }
Write-Host "Token obtenido" -ForegroundColor Green

# Obtener departments con subdepartments
Write-Host "`n=== OBTENIENDO SUBDEPARTMENTS ===" -ForegroundColor Cyan
$departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
Write-Host "Departments disponibles: $($departments.Count)" -ForegroundColor Yellow

# Buscar un department que tenga subdepartments
$deptWithSubdepts = $null
foreach ($dept in $departments) {
    if ($dept.subdepartments -and $dept.subdepartments.Count -gt 0) {
        $deptWithSubdepts = $dept
        break
    }
}

if ($deptWithSubdepts) {
    $subdeptId = $deptWithSubdepts.subdepartments[0].id
    $subdeptName = $deptWithSubdepts.subdepartments[0].name
    Write-Host "✓ Usando subdepartment: $subdeptName (ID: $subdeptId)" -ForegroundColor Green
    
    Write-Host "`n=== PROBANDO POST BRANDS ===" -ForegroundColor Cyan
    # CREATE Brand
    $brandBody = "{`"name`": `"Marca Test CRUD`", `"subdepartment_id`": $subdeptId}"
    try {
        $createdBrand = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method POST -Headers $headers -ContentType "application/json" -Body $brandBody
        Write-Host "✓ POST Brand exitoso: ID $($createdBrand.id) - $($createdBrand.name)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error POST Brand: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n=== PROBANDO POST ATTRIBUTES ===" -ForegroundColor Cyan
    # CREATE Attribute
    $attributeBody = "{`"name`": `"Atributo Test CRUD`", `"subdepartment_id`": $subdeptId}"
    try {
        $createdAttribute = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method POST -Headers $headers -ContentType "application/json" -Body $attributeBody
        Write-Host "✓ POST Attribute exitoso: ID $($createdAttribute.id) - $($createdAttribute.name)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error POST Attribute: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host "✗ No se encontraron subdepartments para crear Brands/Attributes" -ForegroundColor Red
    Write-Host "Mostrando estructura de departments:" -ForegroundColor Yellow
    $departments[0] | ConvertTo-Json -Depth 3 | Write-Host
}

# Verificar totales finales
Write-Host "`n=== VERIFICACIÓN FINAL ===" -ForegroundColor Yellow
$finalBrands = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method GET -Headers $headers
$finalAttributes = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method GET -Headers $headers

Write-Host "TOTALES FINALES:" -ForegroundColor Green
Write-Host "  Brands: $($finalBrands.Count)" -ForegroundColor White
Write-Host "  Attributes: $($finalAttributes.Count)" -ForegroundColor White

Write-Host "`nPrueba completada" -ForegroundColor Blue