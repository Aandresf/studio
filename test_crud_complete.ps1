# Test completo de todos los endpoints CRUD
$baseUrl = "http://127.0.0.1:8080/api"
$headers = @{}

# Función para hacer peticiones HTTP
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    try {
        if ($Body) {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Body $Body -ContentType "application/json" -Headers $Headers
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $Headers
        }
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $response.Content
        }
    } catch {
        return @{
            Success = $false
            StatusCode = $_.Exception.Response.StatusCode
            Error = $_.Exception.Message
        }
    }
}

# 1. AUTENTICACION
Write-Host "=== AUTENTICACION ===" -ForegroundColor Yellow
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/auth/login" -Body $loginData

if ($authResponse.Success) {
    $authResult = $authResponse.Content | ConvertFrom-Json
    $headers["Authorization"] = "Bearer $($authResult.token)"
    Write-Host "✅ Autenticación exitosa" -ForegroundColor Green
} else {
    Write-Host "❌ Error en autenticación: $($authResponse.Error)" -ForegroundColor Red
    exit 1
}

# 2. TEST DEPARTMENTS
Write-Host "`n=== TEST DEPARTMENTS ===" -ForegroundColor Yellow

# GET Departments
$deptResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/departments" -Headers $headers
if ($deptResponse.Success) {
    $departments = $deptResponse.Content | ConvertFrom-Json
    Write-Host "✅ GET Departments: $($departments.Count) departamentos encontrados" -ForegroundColor Green
} else {
    Write-Host "❌ GET Departments falló: $($deptResponse.Error)" -ForegroundColor Red
}

# POST Department
$newDeptName = "TestDepartment_$(Get-Date -Format 'HHmmss')"
$deptData = '{"name":"' + $newDeptName + '"}'
$postDeptResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/departments" -Body $deptData -Headers $headers

if ($postDeptResponse.Success) {
    $newDept = $postDeptResponse.Content | ConvertFrom-Json
    Write-Host "✅ POST Department: Creado ID $($newDept.id)" -ForegroundColor Green
} else {
    Write-Host "❌ POST Department falló: $($postDeptResponse.Error)" -ForegroundColor Red
}

# 3. TEST BRANDS
Write-Host "`n=== TEST BRANDS ===" -ForegroundColor Yellow

# GET Brands
$brandResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/brands" -Headers $headers
if ($brandResponse.Success) {
    $brands = $brandResponse.Content | ConvertFrom-Json
    Write-Host "✅ GET Brands: $($brands.Count) marcas encontradas" -ForegroundColor Green
} else {
    Write-Host "❌ GET Brands falló: $($brandResponse.Error)" -ForegroundColor Red
}

# POST Brand
$newBrandName = "TestBrand_$(Get-Date -Format 'HHmmss')"
$brandData = '{"name":"' + $newBrandName + '","subdepartment_id":null}'
$postBrandResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/brands" -Body $brandData -Headers $headers

if ($postBrandResponse.Success) {
    $newBrand = $postBrandResponse.Content | ConvertFrom-Json
    Write-Host "✅ POST Brand: Creado ID $($newBrand.id)" -ForegroundColor Green
} else {
    Write-Host "❌ POST Brand falló: $($postBrandResponse.Error)" -ForegroundColor Red
}

# 4. TEST ATTRIBUTES
Write-Host "`n=== TEST ATTRIBUTES ===" -ForegroundColor Yellow

# GET Attributes
$attrResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/attributes" -Headers $headers
if ($attrResponse.Success) {
    $attributes = $attrResponse.Content | ConvertFrom-Json
    Write-Host "✅ GET Attributes: $($attributes.Count) atributos encontrados" -ForegroundColor Green
} else {
    Write-Host "❌ GET Attributes falló: $($attrResponse.Error)" -ForegroundColor Red
}

# POST Attribute
$newAttrName = "TestAttribute_$(Get-Date -Format 'HHmmss')"
$attrData = '{"name":"' + $newAttrName + '","subdepartment_id":null}'
$postAttrResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/attributes" -Body $attrData -Headers $headers

if ($postAttrResponse.Success) {
    $newAttr = $postAttrResponse.Content | ConvertFrom-Json
    Write-Host "✅ POST Attribute: Creado ID $($newAttr.id)" -ForegroundColor Green
} else {
    Write-Host "❌ POST Attribute falló: $($postAttrResponse.Error)" -ForegroundColor Red
}

# 5. TEST CUSTOMERS
Write-Host "`n=== TEST CUSTOMERS ===" -ForegroundColor Yellow

# GET Customers
$custResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/customers" -Headers $headers
if ($custResponse.Success) {
    $customers = $custResponse.Content | ConvertFrom-Json
    Write-Host "✅ GET Customers: $($customers.Count) clientes encontrados" -ForegroundColor Green
} else {
    Write-Host "❌ GET Customers falló: $($custResponse.Error)" -ForegroundColor Red
}

# POST Customer
$timestamp = Get-Date -Format 'HHmmss'
$custData = '{"name":"TestCustomer_' + $timestamp + '","document":"DOC' + $timestamp + '","email":"test' + $timestamp + '@test.com","phone":"555-' + $timestamp + '"}'
$postCustResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/customers" -Body $custData -Headers $headers

if ($postCustResponse.Success) {
    $newCust = $postCustResponse.Content | ConvertFrom-Json
    Write-Host "✅ POST Customer: Creado ID $($newCust.id)" -ForegroundColor Green
} else {
    Write-Host "❌ POST Customer falló: $($postCustResponse.Error)" -ForegroundColor Red
}

# 6. RESUMEN FINAL
Write-Host "`n=== RESUMEN FINAL ===" -ForegroundColor Cyan

$finalDeptResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/departments" -Headers $headers
$finalBrandResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/brands" -Headers $headers
$finalAttrResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/attributes" -Headers $headers
$finalCustResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/customers" -Headers $headers

if ($finalDeptResponse.Success) {
    $finalDepts = $finalDeptResponse.Content | ConvertFrom-Json
    Write-Host "*** Total Departments: $($finalDepts.Count)" -ForegroundColor White
}

if ($finalBrandResponse.Success) {
    $finalBrands = $finalBrandResponse.Content | ConvertFrom-Json
    Write-Host "*** Total Brands: $($finalBrands.Count)" -ForegroundColor White
}

if ($finalAttrResponse.Success) {
    $finalAttrs = $finalAttrResponse.Content | ConvertFrom-Json
    Write-Host "*** Total Attributes: $($finalAttrs.Count)" -ForegroundColor White
}

if ($finalCustResponse.Success) {
    $finalCusts = $finalCustResponse.Content | ConvertFrom-Json
    Write-Host "*** Total Customers: $($finalCusts.Count)" -ForegroundColor White
}

Write-Host "`n*** VALIDACION CRUD COMPLETA FINALIZADA!" -ForegroundColor Green