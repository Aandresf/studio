Write-Host "=== PRUEBAS CRUD COMPLETAS ===" -ForegroundColor Green

# Autenticación
$loginBody = '{"username": "admin", "password": "admin"}'
$authResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $authResponse.token
Write-Host "✓ Token obtenido" -ForegroundColor Green

$headers = @{ "Authorization" = "Bearer $token" }

Write-Host "`n=== 1. DEPARTMENTS CRUD ===" -ForegroundColor Cyan

# READ - Listar departments
try {
    $departments = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method GET -Headers $headers
    Write-Host "✓ GET Departments: $($departments.Count) registros" -ForegroundColor Green
    if ($departments.Count -gt 0) {
        $firstDept = $departments[0]
        Write-Host "  - Primer departamento: $($firstDept.name)" -ForegroundColor Gray
        
        # READ - Obtener department específico
        try {
            $singleDept = Invoke-RestMethod -Uri "http://localhost:8080/api/departments/$($firstDept.id)" -Method GET -Headers $headers
            Write-Host "✓ GET Department by ID: $($singleDept.name)" -ForegroundColor Green
        } catch {
            Write-Host "✗ Error GET Department by ID: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "✗ Error GET Departments: $($_.Exception.Message)" -ForegroundColor Red
}

# CREATE - Crear nuevo department
try {
    $newDept = @{
        name = "Departamento Test"
        description = "Descripción de prueba"
    } | ConvertTo-Json
    
    $createdDept = Invoke-RestMethod -Uri "http://localhost:8080/api/departments" -Method POST -Headers $headers -ContentType "application/json" -Body $newDept
    Write-Host "✓ POST Department: Creado ID $($createdDept.id)" -ForegroundColor Green
    $testDeptId = $createdDept.id
} catch {
    Write-Host "✗ Error POST Department: $($_.Exception.Message)" -ForegroundColor Red
}

# UPDATE - Actualizar department
if ($testDeptId) {
    try {
        $updateDept = @{
            name = "Departamento Test Actualizado"
            description = "Descripción actualizada"
        } | ConvertTo-Json
        
        $updatedDept = Invoke-RestMethod -Uri "http://localhost:8080/api/departments/$testDeptId" -Method PUT -Headers $headers -ContentType "application/json" -Body $updateDept
        Write-Host "✓ PUT Department: $($updatedDept.name)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error PUT Department: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# DELETE - Eliminar department
if ($testDeptId) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8080/api/departments/$testDeptId" -Method DELETE -Headers $headers
        Write-Host "✓ DELETE Department: Eliminado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error DELETE Department: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== 2. BRANDS CRUD ===" -ForegroundColor Cyan

# READ - Listar brands
try {
    $brands = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method GET -Headers $headers
    Write-Host "✓ GET Brands: $($brands.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "✗ Error GET Brands: $($_.Exception.Message)" -ForegroundColor Red
}

# CREATE - Crear nueva brand (necesita subdepartment_id)
if ($departments.Count -gt 0 -and $departments[0].subdepartments.Count -gt 0) {
    try {
        $subdeptId = $departments[0].subdepartments[0].id
        $newBrand = @{
            name = "Marca Test"
            subdepartment_id = $subdeptId
        } | ConvertTo-Json
        
        $createdBrand = Invoke-RestMethod -Uri "http://localhost:8080/api/brands" -Method POST -Headers $headers -ContentType "application/json" -Body $newBrand
        Write-Host "✓ POST Brand: Creada ID $($createdBrand.id)" -ForegroundColor Green
        $testBrandId = $createdBrand.id
    } catch {
        Write-Host "✗ Error POST Brand: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "! Skipping Brand CREATE - No subdepartments available" -ForegroundColor Yellow
}

Write-Host "`n=== 3. CUSTOMERS CRUD ===" -ForegroundColor Cyan

# READ - Listar customers
try {
    $customers = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method GET -Headers $headers
    Write-Host "✓ GET Customers: $($customers.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "✗ Error GET Customers: $($_.Exception.Message)" -ForegroundColor Red
}

# CREATE - Crear nuevo customer
try {
    $newCustomer = @{
        name = "Cliente Test"
        email = "test@test.com"
        phone = "123456789"
        address = "Dirección Test"
        rfc = "TEST123"
        notes = "Notas de prueba"
    } | ConvertTo-Json
    
    $createdCustomer = Invoke-RestMethod -Uri "http://localhost:8080/api/customers" -Method POST -Headers $headers -ContentType "application/json" -Body $newCustomer
    Write-Host "✓ POST Customer: Creado ID $($createdCustomer.id)" -ForegroundColor Green
    $testCustomerId = $createdCustomer.id
} catch {
    Write-Host "✗ Error POST Customer: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 4. ATTRIBUTES CRUD ===" -ForegroundColor Cyan

# READ - Listar attributes
try {
    $attributes = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method GET -Headers $headers
    Write-Host "✓ GET Attributes: $($attributes.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "✗ Error GET Attributes: $($_.Exception.Message)" -ForegroundColor Red
}

# CREATE - Crear nuevo attribute
if ($departments.Count -gt 0 -and $departments[0].subdepartments.Count -gt 0) {
    try {
        $subdeptId = $departments[0].subdepartments[0].id
        $newAttribute = @{
            name = "Atributo Test"
            subdepartment_id = $subdeptId
        } | ConvertTo-Json
        
        $createdAttribute = Invoke-RestMethod -Uri "http://localhost:8080/api/attributes" -Method POST -Headers $headers -ContentType "application/json" -Body $newAttribute
        Write-Host "✓ POST Attribute: Creado ID $($createdAttribute.id)" -ForegroundColor Green
        $testAttributeId = $createdAttribute.id
    } catch {
        Write-Host "✗ Error POST Attribute: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "! Skipping Attribute CREATE - No subdepartments available" -ForegroundColor Yellow
}

Write-Host "`n=== RESUMEN CRUD COMPLETADO ===" -ForegroundColor Yellow
Write-Host "Todas las pruebas CRUD ejecutadas" -ForegroundColor Blue