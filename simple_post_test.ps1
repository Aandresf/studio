# Test POST simple para Brands y Attributes
$baseUrl = "http://127.0.0.1:8080"

# Obtener token
$authResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    username = "admin"
    password = "admin"
} | ConvertTo-Json) -ContentType "application/json"

$token = $authResponse.token
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "TOKEN OBTENIDO"

# Obtener subdepartments
$subdepartments = Invoke-RestMethod -Uri "$baseUrl/departments/subdepartments" -Method GET -Headers $headers
$firstSubdept = $subdepartments[0]
Write-Host "Usando subdepartment ID: $($firstSubdept.id)"

# Test POST Brand
Write-Host "Probando POST Brand..."
try {
    $brandData = @{
        name = "TestBrand001"
        subdepartment_id = $firstSubdept.id
    }
    
    $newBrand = Invoke-RestMethod -Uri "$baseUrl/brands" -Method POST -Body ($brandData | ConvertTo-Json) -ContentType "application/json" -Headers $headers
    Write-Host "Brand creada: ID=$($newBrand.id), Name=$($newBrand.name)"
} catch {
    Write-Host "Error Brand: $($_.Exception.Message)"
}

# Test POST Attribute
Write-Host "Probando POST Attribute..."
try {
    $attributeData = @{
        name = "TestAttribute001"
        subdepartment_id = $firstSubdept.id
        description = "Test description"
    }
    
    $newAttribute = Invoke-RestMethod -Uri "$baseUrl/attributes" -Method POST -Body ($attributeData | ConvertTo-Json) -ContentType "application/json" -Headers $headers
    Write-Host "Attribute creado: ID=$($newAttribute.id), Name=$($newAttribute.name)"
} catch {
    Write-Host "Error Attribute: $($_.Exception.Message)"
}

# Verificar totales
$brands = Invoke-RestMethod -Uri "$baseUrl/brands" -Method GET -Headers $headers
$attributes = Invoke-RestMethod -Uri "$baseUrl/attributes" -Method GET -Headers $headers

Write-Host "Totales - Brands: $($brands.Count), Attributes: $($attributes.Count)"