# Test básico de login usando solo PowerShell nativo
try {
    $body = '{"username":"admin","password":"admin"}'
    $headers = @{'Content-Type' = 'application/json'}
    
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/auth/login" -Method POST -Body $body -Headers $headers -UseBasicParsing
    
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body: $($response.Content)" -ForegroundColor Cyan
    
    if ($response.StatusCode -eq 200) {
        $tokenData = $response.Content | ConvertFrom-Json
        Write-Host "Token obtenido: $($tokenData.token.Substring(0,20))..." -ForegroundColor Green
        
        # Ahora probar un endpoint que requiere autenticación
        $authHeaders = @{
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $($tokenData.token)"
        }
        
        Write-Host "`nProbando endpoint de departments..." -ForegroundColor Yellow
        $deptResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/departments" -Method GET -Headers $authHeaders -UseBasicParsing
        Write-Host "Departments response status: $($deptResponse.StatusCode)" -ForegroundColor Green
        
        $departments = $deptResponse.Content | ConvertFrom-Json
        Write-Host "Total departments: $($departments.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}