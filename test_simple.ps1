# Test POST para Brands y Attributes - Final Simple
try {
    # Autenticacion
    Write-Host "=== AUTENTICACION ===" -ForegroundColor Yellow
    $body = '{"username":"admin","password":"admin"}'
    $headers = @{'Content-Type' = 'application/json'}
    
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/auth/login" -Method POST -Body $body -Headers $headers -UseBasicParsing
    $tokenData = $response.Content | ConvertFrom-Json
    
    $authHeaders = @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $($tokenData.token)"
    }
    
    Write-Host "Token obtenido exitosamente" -ForegroundColor Green
    
    # Test POST Brand
    Write-Host "`n=== TEST POST BRAND ===" -ForegroundColor Yellow
    $brandName = "TestBrand_$(Get-Date -Format 'HHmmss')"
    $brandData = '{"name":"' + $brandName + '","subdepartment_id":null}'
    
    Write-Host "Enviando: $brandData" -ForegroundColor Gray
    
    $brandResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/brands" -Method POST -Body $brandData -Headers $authHeaders -UseBasicParsing
    
    if ($brandResponse.StatusCode -eq 201) {
        $newBrand = $brandResponse.Content | ConvertFrom-Json
        Write-Host "Brand creada:" -ForegroundColor Green
        Write-Host "  ID: $($newBrand.id)" -ForegroundColor Cyan
        Write-Host "  Name: $($newBrand.name)" -ForegroundColor Cyan
    } else {
        Write-Host "Error creando Brand: $($brandResponse.StatusCode)" -ForegroundColor Red
    }
    
    # Test POST Attribute
    Write-Host "`n=== TEST POST ATTRIBUTE ===" -ForegroundColor Yellow
    $attributeName = "TestAttribute_$(Get-Date -Format 'HHmmss')"
    $attributeData = '{"name":"' + $attributeName + '","subdepartment_id":null}'
    
    Write-Host "Enviando: $attributeData" -ForegroundColor Gray
    
    $attributeResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/attributes" -Method POST -Body $attributeData -Headers $authHeaders -UseBasicParsing
    
    if ($attributeResponse.StatusCode -eq 201) {
        $newAttribute = $attributeResponse.Content | ConvertFrom-Json
        Write-Host "Attribute creado:" -ForegroundColor Green
        Write-Host "  ID: $($newAttribute.id)" -ForegroundColor Cyan
        Write-Host "  Name: $($newAttribute.name)" -ForegroundColor Cyan
    } else {
        Write-Host "Error creando Attribute: $($attributeResponse.StatusCode)" -ForegroundColor Red
    }
    
    # Verificar totales
    Write-Host "`n=== TOTALES ===" -ForegroundColor Yellow
    
    $brandsResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/brands" -Method GET -Headers $authHeaders -UseBasicParsing
    $brands = $brandsResponse.Content | ConvertFrom-Json
    
    $attributesResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/attributes" -Method GET -Headers $authHeaders -UseBasicParsing
    $attributes = $attributesResponse.Content | ConvertFrom-Json
    
    Write-Host "Brands: $($brands.Count)" -ForegroundColor Cyan
    Write-Host "Attributes: $($attributes.Count)" -ForegroundColor Cyan
    
    Write-Host "`nPRUEBAS COMPLETADAS EXITOSAMENTE!" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}