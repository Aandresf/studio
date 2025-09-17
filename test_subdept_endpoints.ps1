# Prueba especifica para endpoints de subdepartamentos
$baseUrl = "http://127.0.0.1:8080/api"

# Autenticacion
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method "POST" -Body $loginData -ContentType "application/json"
$authResult = $authResponse.Content | ConvertFrom-Json
$headers = @{"Authorization" = "Bearer $($authResult.token)"}

Write-Host "=== PRUEBA ENDPOINTS SUBDEPARTAMENTOS ===" -ForegroundColor Yellow

# Obtener un departamento existente
$deptsResponse = Invoke-WebRequest -Uri "$baseUrl/departments" -Method "GET" -Headers $headers
$departments = $deptsResponse.Content | ConvertFrom-Json
$testDept = $departments[0]
Write-Host "Usando departamento: '$($testDept.name)' (ID: $($testDept.id))"

# Obtener subdepartamentos del departamento
$subdeptsResponse = Invoke-WebRequest -Uri "$baseUrl/departments/$($testDept.id)/subdepartments" -Method "GET" -Headers $headers
$subdepartments = $subdeptsResponse.Content | ConvertFrom-Json
Write-Host "Subdepartamentos en este departamento: $($subdepartments.Count)"

if ($subdepartments.Count -gt 0) {
    $testSubdept = $subdepartments[0]
    Write-Host "Probando con subdepartamento: ID=$($testSubdept.id), Nombre='$($testSubdept.name)'"
    
    # Probar GET subdepartment by ID con diferentes rutas
    Write-Host "`nProbando diferentes rutas para GET subdepartamento:"
    
    # Ruta 1: /api/departments/subdepartments/{id}
    Write-Host "1. GET /api/departments/subdepartments/$($testSubdept.id)"
    try {
        $response1 = Invoke-WebRequest -Uri "$baseUrl/departments/subdepartments/$($testSubdept.id)" -Method "GET" -Headers $headers
        $subdept1 = $response1.Content | ConvertFrom-Json
        Write-Host "   ✅ Funcionando: '$($subdept1.name)'" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Ruta 2: /api/subdepartments/{id}
    Write-Host "2. GET /api/subdepartments/$($testSubdept.id)"
    try {
        $response2 = Invoke-WebRequest -Uri "$baseUrl/subdepartments/$($testSubdept.id)" -Method "GET" -Headers $headers
        $subdept2 = $response2.Content | ConvertFrom-Json
        Write-Host "   ✅ Funcionando: '$($subdept2.name)'" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Probar UPDATE con ruta correcta
    Write-Host "`nProbando UPDATE subdepartamento:"
    $updateData = @{
        name = "UpdatedSubdept_$(Get-Date -Format 'HHmmss')"
        abbreviation = "UPD"
        department_id = $testDept.id
    } | ConvertTo-Json
    
    try {
        $updateResponse = Invoke-WebRequest -Uri "$baseUrl/departments/subdepartments/$($testSubdept.id)" -Method "PUT" -Body $updateData -ContentType "application/json" -Headers $headers
        $updatedSubdept = $updateResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ UPDATE funcionando: '$($updatedSubdept.name)'" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ UPDATE Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host "No hay subdepartamentos para probar. Creando uno nuevo..."
    
    $newSubdeptData = @{
        name = "TestSubdept_$(Get-Date -Format 'HHmmss')"
        abbreviation = "TEST"
        department_id = $testDept.id
    } | ConvertTo-Json
    
    try {
        $createResponse = Invoke-WebRequest -Uri "$baseUrl/departments/$($testDept.id)/subdepartments" -Method "POST" -Body $newSubdeptData -ContentType "application/json" -Headers $headers
        $newSubdept = $createResponse.Content | ConvertFrom-Json
        Write-Host "✅ Subdepartamento creado: ID=$($newSubdept.id), Nombre='$($newSubdept.name)'" -ForegroundColor Green
        
        # Ahora probar GET con el nuevo subdepartamento
        Write-Host "`nProbando GET con nuevo subdepartamento:"
        try {
            $getResponse = Invoke-WebRequest -Uri "$baseUrl/departments/subdepartments/$($newSubdept.id)" -Method "GET" -Headers $headers
            $getSubdept = $getResponse.Content | ConvertFrom-Json
            Write-Host "✅ GET funcionando: '$($getSubdept.name)'" -ForegroundColor Green
        } catch {
            Write-Host "❌ GET Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error creando subdepartamento: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== PRUEBA COMPLETADA ===" -ForegroundColor Green