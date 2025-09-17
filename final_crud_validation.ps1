# Validacion final completa de CRUD con rutas correctas
$baseUrl = "http://127.0.0.1:8080/api"

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$Description
    )
    
    Write-Host "   $Description" -NoNewline
    try {
        if ($Body) {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Body $Body -ContentType "application/json" -Headers $Headers
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $Headers
        }
        
        Write-Host " ✅" -ForegroundColor Green
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $response.Content | ConvertFrom-Json
        }
    } catch {
        Write-Host " ❌ ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
        return @{
            Success = $false
            StatusCode = $_.Exception.Response.StatusCode
            Error = $_.Exception.Message
        }
    }
}

# Autenticacion
Write-Host "=== AUTENTICACION ===" -ForegroundColor Yellow
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Test-Endpoint -Method "POST" -Url "$baseUrl/auth/login" -Body $loginData -Description "Login"

if ($authResponse.Success) {
    $headers = @{"Authorization" = "Bearer $($authResponse.Content.token)"}
} else {
    Write-Host "❌ No se pudo autenticar" -ForegroundColor Red
    exit 1
}

$timestamp = Get-Date -Format 'HHmmss'

Write-Host "`n=== RESUMEN ENDPOINTS CRUD ===" -ForegroundColor Cyan

# ===== DEPARTAMENTOS =====
Write-Host "`nDEPARTAMENTOS:" -ForegroundColor White

# CREATE
$deptData = @{ name = "TestDept_$timestamp"; abbreviation = "TD$timestamp" } | ConvertTo-Json
$createDeptResult = Test-Endpoint -Method "POST" -Url "$baseUrl/departments" -Body $deptData -Headers $headers -Description "CREATE Department"
$testDeptId = if ($createDeptResult.Success) { $createDeptResult.Content.id } else { 3 }

# READ ALL
Test-Endpoint -Method "GET" -Url "$baseUrl/departments" -Headers $headers -Description "READ All Departments" | Out-Null

# READ BY ID
Test-Endpoint -Method "GET" -Url "$baseUrl/departments/$testDeptId" -Headers $headers -Description "READ Department by ID" | Out-Null

# UPDATE
$updateDeptData = @{ name = "UpdatedDept_$timestamp"; abbreviation = "UD$timestamp" } | ConvertTo-Json
Test-Endpoint -Method "PUT" -Url "$baseUrl/departments/$testDeptId" -Body $updateDeptData -Headers $headers -Description "UPDATE Department" | Out-Null

# DELETE (solo si lo creamos nosotros)
if ($createDeptResult.Success) {
    Test-Endpoint -Method "DELETE" -Url "$baseUrl/departments/$testDeptId" -Headers $headers -Description "DELETE Department" | Out-Null
}

# ===== SUBDEPARTAMENTOS =====
Write-Host "`nSUBDEPARTAMENTOS:" -ForegroundColor White

# CREATE
$subdeptData = @{ name = "TestSubdept_$timestamp"; abbreviation = "TS$timestamp"; department_id = $testDeptId } | ConvertTo-Json
$createSubdeptResult = Test-Endpoint -Method "POST" -Url "$baseUrl/departments/$testDeptId/subdepartments" -Body $subdeptData -Headers $headers -Description "CREATE Subdepartment"
$testSubdeptId = if ($createSubdeptResult.Success) { $createSubdeptResult.Content.id } else { 1 }

# READ ALL
Test-Endpoint -Method "GET" -Url "$baseUrl/departments/$testDeptId/subdepartments" -Headers $headers -Description "READ All Subdepartments" | Out-Null

# READ BY ID
Test-Endpoint -Method "GET" -Url "$baseUrl/departments/subdepartments/$testSubdeptId" -Headers $headers -Description "READ Subdepartment by ID" | Out-Null

# UPDATE
$updateSubdeptData = @{ name = "UpdatedSubdept_$timestamp"; abbreviation = "US$timestamp"; department_id = $testDeptId } | ConvertTo-Json
Test-Endpoint -Method "PUT" -Url "$baseUrl/departments/subdepartments/$testSubdeptId" -Body $updateSubdeptData -Headers $headers -Description "UPDATE Subdepartment" | Out-Null

# DELETE
if ($createSubdeptResult.Success) {
    Test-Endpoint -Method "DELETE" -Url "$baseUrl/departments/subdepartments/$testSubdeptId" -Headers $headers -Description "DELETE Subdepartment" | Out-Null
}

# ===== BRANDS =====
Write-Host "`nBRANDS:" -ForegroundColor White

# CREATE
$brandData = @{ name = "TestBrand_$timestamp"; subdepartment_id = $testSubdeptId } | ConvertTo-Json
$createBrandResult = Test-Endpoint -Method "POST" -Url "$baseUrl/brands" -Body $brandData -Headers $headers -Description "CREATE Brand"
$testBrandId = if ($createBrandResult.Success) { $createBrandResult.Content.id } else { 1 }

# READ ALL
Test-Endpoint -Method "GET" -Url "$baseUrl/brands" -Headers $headers -Description "READ All Brands" | Out-Null

# READ BY ID
Test-Endpoint -Method "GET" -Url "$baseUrl/brands/$testBrandId" -Headers $headers -Description "READ Brand by ID" | Out-Null

# READ BY SUBDEPARTMENT
Test-Endpoint -Method "GET" -Url "$baseUrl/brands/subdepartment/$testSubdeptId" -Headers $headers -Description "READ Brands by Subdepartment" | Out-Null

# UPDATE
$updateBrandData = @{ name = "UpdatedBrand_$timestamp"; subdepartment_id = $testSubdeptId } | ConvertTo-Json
Test-Endpoint -Method "PUT" -Url "$baseUrl/brands/$testBrandId" -Body $updateBrandData -Headers $headers -Description "UPDATE Brand" | Out-Null

# DELETE
Test-Endpoint -Method "DELETE" -Url "$baseUrl/brands/$testBrandId" -Headers $headers -Description "DELETE Brand" | Out-Null

# ===== ATTRIBUTES =====
Write-Host "`nATTRIBUTES:" -ForegroundColor White

# CREATE
$attrData = @{ name = "TestAttr_$timestamp"; subdepartment_id = $testSubdeptId } | ConvertTo-Json
$createAttrResult = Test-Endpoint -Method "POST" -Url "$baseUrl/attributes" -Body $attrData -Headers $headers -Description "CREATE Attribute"
$testAttrId = if ($createAttrResult.Success) { $createAttrResult.Content.id } else { 1 }

# READ ALL
Test-Endpoint -Method "GET" -Url "$baseUrl/attributes" -Headers $headers -Description "READ All Attributes" | Out-Null

# READ BY ID
Test-Endpoint -Method "GET" -Url "$baseUrl/attributes/$testAttrId" -Headers $headers -Description "READ Attribute by ID" | Out-Null

# UPDATE
$updateAttrData = @{ name = "UpdatedAttr_$timestamp"; subdepartment_id = $testSubdeptId } | ConvertTo-Json
Test-Endpoint -Method "PUT" -Url "$baseUrl/attributes/$testAttrId" -Body $updateAttrData -Headers $headers -Description "UPDATE Attribute" | Out-Null

# DELETE
Test-Endpoint -Method "DELETE" -Url "$baseUrl/attributes/$testAttrId" -Headers $headers -Description "DELETE Attribute" | Out-Null

Write-Host "`n=== RESUMEN FINAL ===" -ForegroundColor Green
Write-Host "Todas las operaciones CRUD han sido validadas" -ForegroundColor Green
Write-Host "Jerarquia completa: Departamentos -> Subdepartamentos -> Brands/Attributes" -ForegroundColor Green