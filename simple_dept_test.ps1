$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username": "admin", "password": "admin"}'
$headers = @{ "Authorization" = "Bearer $($authResponse.token)" }
$deptBody = '{"name": "Test Department", "abbreviation": "TD"}'
$result = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method POST -Headers $headers -ContentType "application/json" -Body $deptBody
Write-Host "Department creado: ID $($result.id), Nombre: $($result.name)"