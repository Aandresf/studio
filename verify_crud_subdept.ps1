# Verificacion final de CRUD con subdepartments
$baseUrl = "http://127.0.0.1:8080/api"

# Autenticacion
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method "POST" -Body $loginData -ContentType "application/json"
$authResult = $authResponse.Content | ConvertFrom-Json
$headers = @{"Authorization" = "Bearer $($authResult.token)"}

Write-Host "=== VERIFICACION FINAL CRUD CON SUBDEPARTMENTS ==="

# 1. Verificar subdepartamentos creados
Write-Host "`n1. SUBDEPARTAMENTOS:"
$deptResponse = Invoke-WebRequest -Uri "$baseUrl/departments" -Method "GET" -Headers $headers
$departments = $deptResponse.Content | ConvertFrom-Json
$firstDept = $departments[0]

$subdeptResponse = Invoke-WebRequest -Uri "$baseUrl/departments/$($firstDept.id)/subdepartments" -Method "GET" -Headers $headers
$subdepartments = $subdeptResponse.Content | ConvertFrom-Json
Write-Host "   Total subdepartamentos en '$($firstDept.name)': $($subdepartments.Count)"

if ($subdepartments.Count -gt 0) {
    $testSubdept = $subdepartments[0]
    Write-Host "   Primer subdepartamento: ID=$($testSubdept.id), Nombre='$($testSubdept.name)'"
    
    # 2. Verificar brands con subdepartment_id
    Write-Host "`n2. BRANDS CON SUBDEPARTMENT_ID:"
    $brandsResponse = Invoke-WebRequest -Uri "$baseUrl/brands" -Method "GET" -Headers $headers
    $brands = $brandsResponse.Content | ConvertFrom-Json
    $brandsConSubdept = $brands | Where-Object { $_.subdepartment_id -eq $testSubdept.id }
    Write-Host "   Total brands: $($brands.Count)"
    Write-Host "   Brands con subdepartment_id $($testSubdept.id): $($brandsConSubdept.Count)"
    
    if ($brandsConSubdept.Count -gt 0) {
        Write-Host "   Ejemplo: '$($brandsConSubdept[0].name)' (ID: $($brandsConSubdept[0].id))"
    }
    
    # 3. Verificar attributes con subdepartment_id
    Write-Host "`n3. ATTRIBUTES CON SUBDEPARTMENT_ID:"
    $attrsResponse = Invoke-WebRequest -Uri "$baseUrl/attributes" -Method "GET" -Headers $headers
    $attributes = $attrsResponse.Content | ConvertFrom-Json
    $attrsConSubdept = $attributes | Where-Object { $_.subdepartment_id -eq $testSubdept.id }
    Write-Host "   Total attributes: $($attributes.Count)"
    Write-Host "   Attributes con subdepartment_id $($testSubdept.id): $($attrsConSubdept.Count)"
    
    if ($attrsConSubdept.Count -gt 0) {
        Write-Host "   Ejemplo: '$($attrsConSubdept[0].name)' (ID: $($attrsConSubdept[0].id))"
    }
    
    # 4. Probar endpoint de brands por subdepartamento
    Write-Host "`n4. ENDPOINT BRANDS POR SUBDEPARTAMENTO:"
    try {
        $brandsBySubdeptResponse = Invoke-WebRequest -Uri "$baseUrl/brands/subdepartment/$($testSubdept.id)" -Method "GET" -Headers $headers
        $brandsBySubdept = $brandsBySubdeptResponse.Content | ConvertFrom-Json
        Write-Host "   Brands del subdepartamento $($testSubdept.id): $($brandsBySubdept.Count)"
        
        if ($brandsBySubdept.Count -gt 0) {
            Write-Host "   Primera brand: '$($brandsBySubdept[0].name)' (ID: $($brandsBySubdept[0].id))"
        }
    } catch {
        Write-Host "   Error obteniendo brands por subdepartamento: $($_.Exception.Message)"
    }
    
    # 5. Crear una brand y attribute adicional para confirmar funcionalidad
    Write-Host "`n5. CREANDO ELEMENTOS ADICIONALES:"
    $timestamp = Get-Date -Format 'HHmmss'
    
    # Nueva brand
    $newBrandData = @{
        name = "VerificationBrand_$timestamp"
        subdepartment_id = $testSubdept.id
    } | ConvertTo-Json
    
    try {
        $newBrandResponse = Invoke-WebRequest -Uri "$baseUrl/brands" -Method "POST" -Body $newBrandData -ContentType "application/json" -Headers $headers
        $newBrand = $newBrandResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Nueva brand creada: '$($newBrand.name)' (ID: $($newBrand.id))"
    } catch {
        Write-Host "   ❌ Error creando brand: $($_.Exception.Message)"
    }
    
    # Nuevo attribute
    $newAttrData = @{
        name = "VerificationAttr_$timestamp"
        subdepartment_id = $testSubdept.id
    } | ConvertTo-Json
    
    try {
        $newAttrResponse = Invoke-WebRequest -Uri "$baseUrl/attributes" -Method "POST" -Body $newAttrData -ContentType "application/json" -Headers $headers
        $newAttr = $newAttrResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Nuevo attribute creado: '$($newAttr.name)' (ID: $($newAttr.id))"
    } catch {
        Write-Host "   ❌ Error creando attribute: $($_.Exception.Message)"
    }
}

Write-Host "`n*** VERIFICACION COMPLETADA! ***"