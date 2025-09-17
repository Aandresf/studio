# Validacion completa CRUD para toda la jerarquia
# Departamentos -> Subdepartamentos -> Brands/Attributes
$baseUrl = "http://127.0.0.1:8080/api"

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

# Autenticacion
Write-Host "=== AUTENTICACION ===" -ForegroundColor Yellow
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/auth/login" -Body $loginData

if ($authResponse.Success) {
    $authResult = $authResponse.Content | ConvertFrom-Json
    $headers = @{"Authorization" = "Bearer $($authResult.token)"}
    Write-Host "✅ Autenticacion exitosa" -ForegroundColor Green
} else {
    Write-Host "❌ Error en autenticacion: $($authResponse.Error)" -ForegroundColor Red
    exit 1
}

$timestamp = Get-Date -Format 'HHmmss'

# ===== CRUD DEPARTAMENTOS =====
Write-Host "`n=== CRUD DEPARTAMENTOS ===" -ForegroundColor Cyan

# CREATE Department
Write-Host "`n1. CREATE Department:"
$newDeptData = @{
    name = "TestDept_CRUD_$timestamp"
    abbreviation = "TDC$timestamp"
} | ConvertTo-Json

$createDeptResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/departments" -Body $newDeptData -Headers $headers
if ($createDeptResponse.Success) {
    $newDept = $createDeptResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Departamento creado: ID=$($newDept.id), Nombre='$($newDept.name)'" -ForegroundColor Green
    $testDeptId = $newDept.id
} else {
    Write-Host "   ❌ Error creando departamento: $($createDeptResponse.Error)" -ForegroundColor Red
    # Usar departamento existente
    $deptResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/departments" -Headers $headers
    $departments = $deptResponse.Content | ConvertFrom-Json
    $testDeptId = $departments[0].id
    Write-Host "   ⚠️  Usando departamento existente: ID=$testDeptId" -ForegroundColor Yellow
}

# READ Departments
Write-Host "`n2. READ Departments:"
$readDeptsResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/departments" -Headers $headers
if ($readDeptsResponse.Success) {
    $departments = $readDeptsResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Departamentos leidos: $($departments.Count) encontrados" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error leyendo departamentos: $($readDeptsResponse.Error)" -ForegroundColor Red
}

# READ Department by ID
Write-Host "`n3. READ Department by ID:"
$readDeptResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/departments/$testDeptId" -Headers $headers
if ($readDeptResponse.Success) {
    $dept = $readDeptResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Departamento por ID: '$($dept.name)' (ID: $($dept.id))" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error leyendo departamento por ID: $($readDeptResponse.Error)" -ForegroundColor Red
}

# UPDATE Department
Write-Host "`n4. UPDATE Department:"
$updateDeptData = @{
    name = "UpdatedDept_$timestamp"
    abbreviation = "UPD$timestamp"
} | ConvertTo-Json

$updateDeptResponse = Invoke-ApiRequest -Method "PUT" -Url "$baseUrl/departments/$testDeptId" -Body $updateDeptData -Headers $headers
if ($updateDeptResponse.Success) {
    $updatedDept = $updateDeptResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Departamento actualizado: '$($updatedDept.name)'" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error actualizando departamento: $($updateDeptResponse.Error)" -ForegroundColor Red
}

# ===== CRUD SUBDEPARTAMENTOS =====
Write-Host "`n=== CRUD SUBDEPARTAMENTOS ===" -ForegroundColor Cyan

# CREATE Subdepartment
Write-Host "`n1. CREATE Subdepartment:"
$newSubdeptData = @{
    name = "TestSubdept_CRUD_$timestamp"
    abbreviation = "TSC$timestamp"
    department_id = $testDeptId
} | ConvertTo-Json

$createSubdeptResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/departments/$testDeptId/subdepartments" -Body $newSubdeptData -Headers $headers
if ($createSubdeptResponse.Success) {
    $newSubdept = $createSubdeptResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Subdepartamento creado: ID=$($newSubdept.id), Nombre='$($newSubdept.name)'" -ForegroundColor Green
    $testSubdeptId = $newSubdept.id
} else {
    Write-Host "   ❌ Error creando subdepartamento: $($createSubdeptResponse.Error)" -ForegroundColor Red
    $testSubdeptId = $null
}

# READ Subdepartments
Write-Host "`n2. READ Subdepartments:"
$readSubdeptsResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/departments/$testDeptId/subdepartments" -Headers $headers
if ($readSubdeptsResponse.Success) {
    $subdepartments = $readSubdeptsResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Subdepartamentos leidos: $($subdepartments.Count) encontrados" -ForegroundColor Green
    if ($subdepartments.Count -gt 0 -and $testSubdeptId -eq $null) {
        $testSubdeptId = $subdepartments[0].id
    }
} else {
    Write-Host "   ❌ Error leyendo subdepartamentos: $($readSubdeptsResponse.Error)" -ForegroundColor Red
}

if ($testSubdeptId) {
    # READ Subdepartment by ID
    Write-Host "`n3. READ Subdepartment by ID:"
    $readSubdeptResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/subdepartments/$testSubdeptId" -Headers $headers
    if ($readSubdeptResponse.Success) {
        $subdept = $readSubdeptResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Subdepartamento por ID: '$($subdept.name)' (ID: $($subdept.id))" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error leyendo subdepartamento por ID: $($readSubdeptResponse.Error)" -ForegroundColor Red
    }

    # UPDATE Subdepartment
    Write-Host "`n4. UPDATE Subdepartment:"
    $updateSubdeptData = @{
        name = "UpdatedSubdept_$timestamp"
        abbreviation = "UPSUB$timestamp"
        department_id = $testDeptId
    } | ConvertTo-Json

    $updateSubdeptResponse = Invoke-ApiRequest -Method "PUT" -Url "$baseUrl/subdepartments/$testSubdeptId" -Body $updateSubdeptData -Headers $headers
    if ($updateSubdeptResponse.Success) {
        $updatedSubdept = $updateSubdeptResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Subdepartamento actualizado: '$($updatedSubdept.name)'" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error actualizando subdepartamento: $($updateSubdeptResponse.Error)" -ForegroundColor Red
    }
}

# ===== CRUD BRANDS =====
Write-Host "`n=== CRUD BRANDS ===" -ForegroundColor Cyan

# CREATE Brand
Write-Host "`n1. CREATE Brand:"
$newBrandData = @{
    name = "TestBrand_CRUD_$timestamp"
    subdepartment_id = $testSubdeptId
} | ConvertTo-Json

$createBrandResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/brands" -Body $newBrandData -Headers $headers
if ($createBrandResponse.Success) {
    $newBrand = $createBrandResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Brand creada: ID=$($newBrand.id), Nombre='$($newBrand.name)'" -ForegroundColor Green
    $testBrandId = $newBrand.id
} else {
    Write-Host "   ❌ Error creando brand: $($createBrandResponse.Error)" -ForegroundColor Red
    $testBrandId = $null
}

# READ Brands
Write-Host "`n2. READ Brands:"
$readBrandsResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/brands" -Headers $headers
if ($readBrandsResponse.Success) {
    $brands = $readBrandsResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Brands leidas: $($brands.Count) encontradas" -ForegroundColor Green
    if ($brands.Count -gt 0 -and $testBrandId -eq $null) {
        $testBrandId = $brands[0].id
    }
} else {
    Write-Host "   ❌ Error leyendo brands: $($readBrandsResponse.Error)" -ForegroundColor Red
}

if ($testBrandId) {
    # READ Brand by ID
    Write-Host "`n3. READ Brand by ID:"
    $readBrandResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/brands/$testBrandId" -Headers $headers
    if ($readBrandResponse.Success) {
        $brand = $readBrandResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Brand por ID: '$($brand.name)' (ID: $($brand.id))" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error leyendo brand por ID: $($readBrandResponse.Error)" -ForegroundColor Red
    }

    # UPDATE Brand
    Write-Host "`n4. UPDATE Brand:"
    $updateBrandData = @{
        name = "UpdatedBrand_$timestamp"
        subdepartment_id = $testSubdeptId
    } | ConvertTo-Json

    $updateBrandResponse = Invoke-ApiRequest -Method "PUT" -Url "$baseUrl/brands/$testBrandId" -Body $updateBrandData -Headers $headers
    if ($updateBrandResponse.Success) {
        $updatedBrand = $updateBrandResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Brand actualizada: '$($updatedBrand.name)'" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error actualizando brand: $($updateBrandResponse.Error)" -ForegroundColor Red
    }

    # DELETE Brand
    Write-Host "`n5. DELETE Brand:"
    $deleteBrandResponse = Invoke-ApiRequest -Method "DELETE" -Url "$baseUrl/brands/$testBrandId" -Headers $headers
    if ($deleteBrandResponse.Success) {
        Write-Host "   ✅ Brand eliminada correctamente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error eliminando brand: $($deleteBrandResponse.Error)" -ForegroundColor Red
    }
}

# ===== CRUD ATTRIBUTES =====
Write-Host "`n=== CRUD ATTRIBUTES ===" -ForegroundColor Cyan

# CREATE Attribute
Write-Host "`n1. CREATE Attribute:"
$newAttrData = @{
    name = "TestAttr_CRUD_$timestamp"
    subdepartment_id = $testSubdeptId
} | ConvertTo-Json

$createAttrResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/attributes" -Body $newAttrData -Headers $headers
if ($createAttrResponse.Success) {
    $newAttr = $createAttrResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Attribute creado: ID=$($newAttr.id), Nombre='$($newAttr.name)'" -ForegroundColor Green
    $testAttrId = $newAttr.id
} else {
    Write-Host "   ❌ Error creando attribute: $($createAttrResponse.Error)" -ForegroundColor Red
    $testAttrId = $null
}

# READ Attributes
Write-Host "`n2. READ Attributes:"
$readAttrsResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/attributes" -Headers $headers
if ($readAttrsResponse.Success) {
    $attributes = $readAttrsResponse.Content | ConvertFrom-Json
    Write-Host "   ✅ Attributes leidos: $($attributes.Count) encontrados" -ForegroundColor Green
    if ($attributes.Count -gt 0 -and $testAttrId -eq $null) {
        $testAttrId = $attributes[0].id
    }
} else {
    Write-Host "   ❌ Error leyendo attributes: $($readAttrsResponse.Error)" -ForegroundColor Red
}

if ($testAttrId) {
    # READ Attribute by ID
    Write-Host "`n3. READ Attribute by ID:"
    $readAttrResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/attributes/$testAttrId" -Headers $headers
    if ($readAttrResponse.Success) {
        $attr = $readAttrResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Attribute por ID: '$($attr.name)' (ID: $($attr.id))" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error leyendo attribute por ID: $($readAttrResponse.Error)" -ForegroundColor Red
    }

    # UPDATE Attribute
    Write-Host "`n4. UPDATE Attribute:"
    $updateAttrData = @{
        name = "UpdatedAttr_$timestamp"
        subdepartment_id = $testSubdeptId
    } | ConvertTo-Json

    $updateAttrResponse = Invoke-ApiRequest -Method "PUT" -Url "$baseUrl/attributes/$testAttrId" -Body $updateAttrData -Headers $headers
    if ($updateAttrResponse.Success) {
        $updatedAttr = $updateAttrResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Attribute actualizado: '$($updatedAttr.name)'" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error actualizando attribute: $($updateAttrResponse.Error)" -ForegroundColor Red
    }

    # DELETE Attribute
    Write-Host "`n5. DELETE Attribute:"
    $deleteAttrResponse = Invoke-ApiRequest -Method "DELETE" -Url "$baseUrl/attributes/$testAttrId" -Headers $headers
    if ($deleteAttrResponse.Success) {
        Write-Host "   ✅ Attribute eliminado correctamente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error eliminando attribute: $($deleteAttrResponse.Error)" -ForegroundColor Red
    }
}

# DELETE Subdepartment
if ($testSubdeptId) {
    Write-Host "`n5. DELETE Subdepartment:"
    $deleteSubdeptResponse = Invoke-ApiRequest -Method "DELETE" -Url "$baseUrl/subdepartments/$testSubdeptId" -Headers $headers
    if ($deleteSubdeptResponse.Success) {
        Write-Host "   ✅ Subdepartamento eliminado correctamente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error eliminando subdepartamento: $($deleteSubdeptResponse.Error)" -ForegroundColor Red
    }
}

# DELETE Department (solo si lo creamos nosotros)
if ($createDeptResponse.Success) {
    Write-Host "`n5. DELETE Department:"
    $deleteDeptResponse = Invoke-ApiRequest -Method "DELETE" -Url "$baseUrl/departments/$testDeptId" -Headers $headers
    if ($deleteDeptResponse.Success) {
        Write-Host "   ✅ Departamento eliminado correctamente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error eliminando departamento: $($deleteDeptResponse.Error)" -ForegroundColor Red
    }
}

Write-Host "`n=== VALIDACION CRUD COMPLETA FINALIZADA ===" -ForegroundColor Green