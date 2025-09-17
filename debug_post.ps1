# Prueba detallada de POST Department
$loginBody = '{"username": "admin", "password": "admin"}'
$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $authResponse.token
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "=== DEBUGGING POST DEPARTMENT ===" -ForegroundColor Green

# Primero ver la estructura de departments existentes
$departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
Write-Host "Departments existentes: $($departments.Count)" -ForegroundColor Yellow
if ($departments.Count -gt 0) {
    Write-Host "Estructura del primer department:" -ForegroundColor Gray
    $departments[0] | ConvertTo-Json | Write-Host
}

# Probar diferentes variaciones del POST
Write-Host "`nProbando POST con estructura mínima..." -ForegroundColor Yellow
try {
    $body1 = '{"name": "Test Dept"}'
    $result1 = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method POST -Headers $headers -ContentType "application/json" -Body $body1
    Write-Host "✓ POST exitoso con estructura mínima" -ForegroundColor Green
    $result1 | ConvertTo-Json | Write-Host
} catch {
    Write-Host "✗ Error con estructura mínima:" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nProbando POST con description..." -ForegroundColor Yellow
try {
    $body2 = '{"name": "Test Dept 2", "description": "Test description"}'
    $result2 = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method POST -Headers $headers -ContentType "application/json" -Body $body2
    Write-Host "✓ POST exitoso con description" -ForegroundColor Green
    $result2 | ConvertTo-Json | Write-Host
} catch {
    Write-Host "✗ Error con description:" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}