# Prueba corregida de POST Department
$loginBody = '{"username": "admin", "password": "admin"}'
$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $authResponse.token
$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "=== PROBANDO POST DEPARTMENT CORREGIDO ===" -ForegroundColor Green

# POST con estructura correcta (name + abbreviation)
Write-Host "Probando POST con name + abbreviation..." -ForegroundColor Yellow
try {
    $bodyCorrect = '{"name": "Departamento Test", "abbreviation": "DT"}'
    $result = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method POST -Headers $headers -ContentType "application/json" -Body $bodyCorrect
    Write-Host "✓ POST Department exitoso!" -ForegroundColor Green
    Write-Host "ID creado: $($result.id)" -ForegroundColor Green
    Write-Host "Nombre: $($result.name)" -ForegroundColor Green
    Write-Host "Abreviación: $($result.abbreviation)" -ForegroundColor Green
    $testDeptId = $result.id
} catch {
    Write-Host "✗ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Verificar que se creó
Write-Host "`nVerificando lista de departments..." -ForegroundColor Yellow
$departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
Write-Host "Total departments: $($departments.Count)" -ForegroundColor Green

# Probar GET específico
if ($testDeptId) {
    Write-Host "`nProbando GET department específico..." -ForegroundColor Yellow
    try {
        $specificDept = Invoke-RestMethod -Uri "http://localhost:8080/api/departments/$testDeptId" -Method GET -Headers $headers
        Write-Host "✓ GET específico exitoso:" -ForegroundColor Green
        $specificDept | ConvertTo-Json | Write-Host
    } catch {
        Write-Host "✗ Error GET específico: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nPrueba completada" -ForegroundColor Blue