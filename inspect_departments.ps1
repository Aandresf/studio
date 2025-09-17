# Script para inspeccionar la estructura de departamentos
$baseUrl = "http://127.0.0.1:8080/api"

# Autenticacion
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method "POST" -Body $loginData -ContentType "application/json"
$authResult = $authResponse.Content | ConvertFrom-Json
$headers = @{"Authorization" = "Bearer $($authResult.token)"}

# Obtener departamentos
$deptResponse = Invoke-WebRequest -Uri "$baseUrl/departments" -Method "GET" -Headers $headers
$departments = $deptResponse.Content | ConvertFrom-Json

Write-Host "=== ESTRUCTURA DE DEPARTAMENTOS ==="
Write-Host "Total departamentos: $($departments.Count)"
Write-Host ""

for ($i = 0; $i -lt [Math]::Min(3, $departments.Count); $i++) {
    $dept = $departments[$i]
    Write-Host "Departamento $($i + 1):"
    Write-Host "  ID: $($dept.id)"
    Write-Host "  Name: $($dept.name)"
    
    # Verificar propiedades disponibles
    $properties = $dept | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
    Write-Host "  Propiedades disponibles: $($properties -join ', ')"
    
    # Verificar si tiene subdepartments
    if ($dept.PSObject.Properties.Name -contains "subdepartments") {
        $subdeptCount = if ($dept.subdepartments) { $dept.subdepartments.Count } else { "null" }
        Write-Host "  Subdepartments: $subdeptCount"
        if ($dept.subdepartments -and $dept.subdepartments.Count -gt 0) {
            Write-Host "    Primer subdepartamento: ID=$($dept.subdepartments[0].id), Name='$($dept.subdepartments[0].name)'"
        }
    } else {
        Write-Host "  No tiene propiedad 'subdepartments'"
    }
    Write-Host ""
}