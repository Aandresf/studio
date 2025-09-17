# Script para obtener subdepartamentos y probar CRUD
$baseUrl = "http://127.0.0.1:8080/api"

# Autenticacion
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method "POST" -Body $loginData -ContentType "application/json"
$authResult = $authResponse.Content | ConvertFrom-Json
$headers = @{"Authorization" = "Bearer $($authResult.token)"}

Write-Host "=== OBTENIENDO DEPARTAMENTOS ==="
$deptResponse = Invoke-WebRequest -Uri "$baseUrl/departments" -Method "GET" -Headers $headers
$departments = $deptResponse.Content | ConvertFrom-Json
Write-Host "Total departamentos: $($departments.Count)"

# Buscar subdepartamentos en el primer departamento
$firstDept = $departments[0]
Write-Host "`nProbando subdepartamentos del departamento: $($firstDept.name) (ID: $($firstDept.id))"

try {
    $subdeptResponse = Invoke-WebRequest -Uri "$baseUrl/departments/$($firstDept.id)/subdepartments" -Method "GET" -Headers $headers
    $subdepartments = $subdeptResponse.Content | ConvertFrom-Json
    Write-Host "Subdepartamentos encontrados: $($subdepartments.Count)"
    
    if ($subdepartments.Count -gt 0) {
        $selectedSubdept = $subdepartments[0]
        Write-Host "Usando subdepartamento: ID=$($selectedSubdept.id), Nombre='$($selectedSubdept.name)'"
        
        # TEST BRANDS con subdepartment_id
        Write-Host "`n=== TEST BRANDS CON SUBDEPARTMENT_ID ==="
        
        $timestamp = Get-Date -Format 'HHmmss'
        $brandData = @{
            name = "TestBrand_SubDept_$timestamp"
            subdepartment_id = $selectedSubdept.id
        } | ConvertTo-Json
        
        Write-Host "Enviando Brand: $brandData"
        try {
            $postBrandResponse = Invoke-WebRequest -Uri "$baseUrl/brands" -Method "POST" -Body $brandData -ContentType "application/json" -Headers $headers
            $newBrand = $postBrandResponse.Content | ConvertFrom-Json
            Write-Host "✅ Brand creada:"
            Write-Host "  ID: $($newBrand.id)"
            Write-Host "  Nombre: $($newBrand.name)"
            Write-Host "  Subdepartment ID: $($newBrand.subdepartment_id)"
        } catch {
            Write-Host "❌ Error creando Brand: $($_.Exception.Message)"
        }
        
        # TEST ATTRIBUTES con subdepartment_id
        Write-Host "`n=== TEST ATTRIBUTES CON SUBDEPARTMENT_ID ==="
        
        $attrData = @{
            name = "TestAttribute_SubDept_$timestamp"
            subdepartment_id = $selectedSubdept.id
        } | ConvertTo-Json
        
        Write-Host "Enviando Attribute: $attrData"
        try {
            $postAttrResponse = Invoke-WebRequest -Uri "$baseUrl/attributes" -Method "POST" -Body $attrData -ContentType "application/json" -Headers $headers
            $newAttr = $postAttrResponse.Content | ConvertFrom-Json
            Write-Host "✅ Attribute creado:"
            Write-Host "  ID: $($newAttr.id)"
            Write-Host "  Nombre: $($newAttr.name)"
            Write-Host "  Subdepartment ID: $($newAttr.subdepartment_id)"
        } catch {
            Write-Host "❌ Error creando Attribute: $($_.Exception.Message)"
        }
        
    } else {
        Write-Host "No hay subdepartamentos en este departamento. Creando uno..."
        
        # Crear un subdepartamento
        $newSubdeptData = @{
            name = "TestSubdepartamento_$(Get-Date -Format 'HHmmss')"
            abbreviation = "TSUB"
            department_id = $firstDept.id
        } | ConvertTo-Json
        
        try {
            $createSubdeptResponse = Invoke-WebRequest -Uri "$baseUrl/departments/$($firstDept.id)/subdepartments" -Method "POST" -Body $newSubdeptData -ContentType "application/json" -Headers $headers
            $newSubdept = $createSubdeptResponse.Content | ConvertFrom-Json
            Write-Host "✅ Subdepartamento creado: ID=$($newSubdept.id), Nombre='$($newSubdept.name)'"
            
            # Ahora usar este subdepartamento para las pruebas
            $timestamp = Get-Date -Format 'HHmmss'
            
            # Test Brand
            $brandData = @{
                name = "TestBrand_NewSubDept_$timestamp"
                subdepartment_id = $newSubdept.id
            } | ConvertTo-Json
            
            $postBrandResponse = Invoke-WebRequest -Uri "$baseUrl/brands" -Method "POST" -Body $brandData -ContentType "application/json" -Headers $headers
            $newBrand = $postBrandResponse.Content | ConvertFrom-Json
            Write-Host "✅ Brand creada con nuevo subdepartment:"
            Write-Host "  ID: $($newBrand.id)"
            Write-Host "  Nombre: $($newBrand.name)"
            Write-Host "  Subdepartment ID: $($newBrand.subdepartment_id)"
            
            # Test Attribute
            $attrData = @{
                name = "TestAttribute_NewSubDept_$timestamp"
                subdepartment_id = $newSubdept.id
            } | ConvertTo-Json
            
            $postAttrResponse = Invoke-WebRequest -Uri "$baseUrl/attributes" -Method "POST" -Body $attrData -ContentType "application/json" -Headers $headers
            $newAttr = $postAttrResponse.Content | ConvertFrom-Json
            Write-Host "✅ Attribute creado con nuevo subdepartment:"
            Write-Host "  ID: $($newAttr.id)"
            Write-Host "  Nombre: $($newAttr.name)"
            Write-Host "  Subdepartment ID: $($newAttr.subdepartment_id)"
            
        } catch {
            Write-Host "❌ Error creando subdepartamento: $($_.Exception.Message)"
        }
    }
    
} catch {
    Write-Host "❌ Error obteniendo subdepartamentos: $($_.Exception.Message)"
}

Write-Host "`nPRUEBAS COMPLETADAS!"