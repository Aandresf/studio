# Test POST para Brands y Attributes - Final
$baseUrl = "http://127.0.0.1:8080"

# Obtener token de autenticación
$authResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    username = "admin"
    password = "admin"
} | ConvertTo-Json) -ContentType "application/json"

$token = $authResponse.token
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "=== TOKEN OBTENIDO ===" -ForegroundColor Green

# Verificar subdepartments disponibles
Write-Host "`n=== SUBDEPARTMENTS DISPONIBLES ===" -ForegroundColor Yellow
try {
    $subdepartments = Invoke-RestMethod -Uri "$baseUrl/departments/subdepartments" -Method GET -Headers $headers
    Write-Host "Total subdepartments: $($subdepartments.Count)"
    if ($subdepartments.Count -gt 0) {
        $firstSubdept = $subdepartments[0]
        Write-Host "Primer subdepartment: ID=$($firstSubdept.id), Name=$($firstSubdept.name)"
    }
} catch {
    Write-Host "Error obteniendo subdepartments: $($_.Exception.Message)" -ForegroundColor Red
}

# Test POST Brand
Write-Host "`n=== TEST POST BRAND ===" -ForegroundColor Yellow
try {
    $brandData = @{
        name = "Marca Test $(Get-Date -Format 'HHmmss')"
        subdepartment_id = $firstSubdept.id
    }
    
    $newBrand = Invoke-RestMethod -Uri "$baseUrl/brands" -Method POST -Body ($brandData | ConvertTo-Json) -ContentType "application/json" -Headers $headers
    Write-Host "✓ Brand creada exitosamente:" -ForegroundColor Green
    Write-Host "  ID: $($newBrand.id)"
    Write-Host "  Name: $($newBrand.name)"
    Write-Host "  Subdepartment ID: $($newBrand.subdepartment_id)"
} catch {
    Write-Host "✗ Error creando Brand: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $responseBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseBody)
        $errorDetails = $reader.ReadToEnd()
        Write-Host "Detalles del error: $errorDetails" -ForegroundColor Red
    }
}

# Test POST Attribute
Write-Host "`n=== TEST POST ATTRIBUTE ===" -ForegroundColor Yellow
try {
    $attributeData = @{
        name = "Atributo Test $(Get-Date -Format 'HHmmss')"
        subdepartment_id = $firstSubdept.id
        description = "Atributo de prueba"
    }
    
    $newAttribute = Invoke-RestMethod -Uri "$baseUrl/attributes" -Method POST -Body ($attributeData | ConvertTo-Json) -ContentType "application/json" -Headers $headers
    Write-Host "✓ Attribute creado exitosamente:" -ForegroundColor Green
    Write-Host "  ID: $($newAttribute.id)"
    Write-Host "  Name: $($newAttribute.name)"
    Write-Host "  Subdepartment ID: $($newAttribute.subdepartment_id)"
    Write-Host "  Description: $($newAttribute.description)"
} catch {
    Write-Host "✗ Error creando Attribute: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $responseBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseBody)
        $errorDetails = $reader.ReadToEnd()
        Write-Host "Detalles del error: $errorDetails" -ForegroundColor Red
    }
}

# Verificar totales finales
Write-Host "`n=== VERIFICACIÓN FINAL ===" -ForegroundColor Yellow
try {
    $brands = Invoke-RestMethod -Uri "$baseUrl/brands" -Method GET -Headers $headers
    $attributes = Invoke-RestMethod -Uri "$baseUrl/attributes" -Method GET -Headers $headers
    
    Write-Host "Brands totales: $($brands.Count)" -ForegroundColor Cyan
    Write-Host "Attributes totales: $($attributes.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "Error verificando totales: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== PRUEBA COMPLETADA ===" -ForegroundColor Green