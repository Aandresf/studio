# Debug de errores en subdepartamentos
$baseUrl = "http://127.0.0.1:8080/api"

# Autenticacion
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method "POST" -Body $loginData -ContentType "application/json"
$authResult = $authResponse.Content | ConvertFrom-Json
$headers = @{"Authorization" = "Bearer $($authResult.token)"}

Write-Host "=== DEBUG SUBDEPARTAMENTOS ===" -ForegroundColor Yellow

# Obtener un departamento existente
$deptsResponse = Invoke-WebRequest -Uri "$baseUrl/departments" -Method "GET" -Headers $headers
$departments = $deptsResponse.Content | ConvertFrom-Json
$testDept = $departments[0]
Write-Host "Usando departamento: '$($testDept.name)' (ID: $($testDept.id))"

# Intentar crear subdepartamento
Write-Host "`nProbando CREATE Subdepartment..."
$newSubdeptData = @{
    name = "DebugSubdept_$(Get-Date -Format 'HHmmss')"
    abbreviation = "DBG"
    department_id = $testDept.id
} | ConvertTo-Json

Write-Host "Datos enviados: $newSubdeptData"

try {
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/departments/$($testDept.id)/subdepartments" -Method "POST" -Body $newSubdeptData -ContentType "application/json" -Headers $headers
    $newSubdept = $createResponse.Content | ConvertFrom-Json
    Write-Host "✅ Subdepartamento creado: ID=$($newSubdept.id), Nombre='$($newSubdept.name)'" -ForegroundColor Green
    
    # Ahora intentar actualizar
    Write-Host "`nProbando UPDATE Subdepartment..."
    $updateData = @{
        name = "UpdatedDebugSubdept_$(Get-Date -Format 'HHmmss')"
        abbreviation = "UPD"
        department_id = $testDept.id
    } | ConvertTo-Json
    
    Write-Host "Datos de update: $updateData"
    
    try {
        $updateResponse = Invoke-WebRequest -Uri "$baseUrl/departments/subdepartments/$($newSubdept.id)" -Method "PUT" -Body $updateData -ContentType "application/json" -Headers $headers
        $updatedSubdept = $updateResponse.Content | ConvertFrom-Json
        Write-Host "✅ Subdepartamento actualizado: '$($updatedSubdept.name)'" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error en UPDATE: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Response body: $($_.Exception.Response)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error en CREATE: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response body: $($_.Exception.Response)" -ForegroundColor Yellow
}

Write-Host "`n=== DEBUG COMPLETADO ===" -ForegroundColor Green