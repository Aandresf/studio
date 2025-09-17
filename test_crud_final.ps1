# Test completo CRUD para Brands y Attributes
try {
    # Paso 1: Autenticación
    Write-Host "=== PASO 1: AUTENTICACIÓN ===" -ForegroundColor Yellow
    $body = '{"username":"admin","password":"admin"}'
    $headers = @{'Content-Type' = 'application/json'}
    
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/auth/login" -Method POST -Body $body -Headers $headers -UseBasicParsing
    $tokenData = $response.Content | ConvertFrom-Json
    
    $authHeaders = @{
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $($tokenData.token)"
    }
    
    Write-Host "✓ Token obtenido exitosamente" -ForegroundColor Green
    
    # Paso 2: Obtener subdepartments
    Write-Host "`n=== PASO 2: OBTENER SUBDEPARTMENTS ===" -ForegroundColor Yellow
    $subdeptResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/departments/subdepartments" -Method GET -Headers $authHeaders -UseBasicParsing
    $subdepartments = $subdeptResponse.Content | ConvertFrom-Json
    
    if ($subdepartments.Count -gt 0) {
        $firstSubdept = $subdepartments[0]
        Write-Host "✓ Usando subdepartment: ID=$($firstSubdept.id), Name=$($firstSubdept.name)" -ForegroundColor Green
    } else {
        Write-Host "✗ No hay subdepartments disponibles" -ForegroundColor Red
        return
    }
    
    # Paso 3: Test POST Brand
    Write-Host "`n=== PASO 3: TEST POST BRAND ===" -ForegroundColor Yellow
    $brandName = "TestBrand_$(Get-Date -Format 'HHmmss')"
    $brandData = @{
        name = $brandName
        subdepartment_id = $firstSubdept.id
    } | ConvertTo-Json
    
    $brandResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/brands" -Method POST -Body $brandData -Headers $authHeaders -UseBasicParsing
    
    if ($brandResponse.StatusCode -eq 201) {
        $newBrand = $brandResponse.Content | ConvertFrom-Json
        Write-Host "✓ Brand creada exitosamente:" -ForegroundColor Green
        Write-Host "  ID: $($newBrand.id)" -ForegroundColor Cyan
        Write-Host "  Name: $($newBrand.name)" -ForegroundColor Cyan
        Write-Host "  Subdepartment ID: $($newBrand.subdepartment_id)" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Error creando Brand. Status: $($brandResponse.StatusCode)" -ForegroundColor Red
    }
    
    # Paso 4: Test POST Attribute
    Write-Host "`n=== PASO 4: TEST POST ATTRIBUTE ===" -ForegroundColor Yellow
    $attributeName = "TestAttribute_$(Get-Date -Format 'HHmmss')"
    $attributeData = @{
        name = $attributeName
        subdepartment_id = $firstSubdept.id
        description = "Atributo de prueba creado automáticamente"
    } | ConvertTo-Json
    
    $attributeResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/attributes" -Method POST -Body $attributeData -Headers $authHeaders -UseBasicParsing
    
    if ($attributeResponse.StatusCode -eq 201) {
        $newAttribute = $attributeResponse.Content | ConvertFrom-Json
        Write-Host "✓ Attribute creado exitosamente:" -ForegroundColor Green
        Write-Host "  ID: $($newAttribute.id)" -ForegroundColor Cyan
        Write-Host "  Name: $($newAttribute.name)" -ForegroundColor Cyan
        Write-Host "  Subdepartment ID: $($newAttribute.subdepartment_id)" -ForegroundColor Cyan
        Write-Host "  Description: $($newAttribute.description)" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Error creando Attribute. Status: $($attributeResponse.StatusCode)" -ForegroundColor Red
    }
    
    # Paso 5: Verificar totales finales
    Write-Host "`n=== PASO 5: VERIFICACIÓN FINAL ===" -ForegroundColor Yellow
    
    $brandsResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/brands" -Method GET -Headers $authHeaders -UseBasicParsing
    $brands = $brandsResponse.Content | ConvertFrom-Json
    
    $attributesResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/attributes" -Method GET -Headers $authHeaders -UseBasicParsing
    $attributes = $attributesResponse.Content | ConvertFrom-Json
    
    Write-Host "📊 TOTALES ACTUALES:" -ForegroundColor Magenta
    Write-Host "  Brands: $($brands.Count)" -ForegroundColor Cyan
    Write-Host "  Attributes: $($attributes.Count)" -ForegroundColor Cyan
    
    Write-Host "`n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
        } catch {
            Write-Host "No se pudo leer el cuerpo del error" -ForegroundColor Red
        }
    }
}