# Script para probar CRUD de marcas y atributos con subdepartment_id
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

Write-Host "=== AUTENTICACION ==="
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/auth/login" -Body $loginData

if ($authResponse.Success) {
    $authResult = $authResponse.Content | ConvertFrom-Json
    $headers = @{"Authorization" = "Bearer $($authResult.token)"}
    Write-Host "Autenticacion exitosa"
} else {
    Write-Host "Error en autenticacion: $($authResponse.Error)"
    exit 1
}

Write-Host "`n=== OBTENIENDO DEPARTAMENTOS ==="
$deptResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/departments" -Headers $headers

if ($deptResponse.Success) {
    $departments = $deptResponse.Content | ConvertFrom-Json
    Write-Host "Departamentos obtenidos: $($departments.Count)"
    
    # Buscar subdepartamentos
    $subdepartments = @()
    foreach ($dept in $departments) {
        if ($dept.subdepartments -and $dept.subdepartments.Count -gt 0) {
            $subdepartments += $dept.subdepartments
        }
    }
    
    Write-Host "Subdepartamentos encontrados: $($subdepartments.Count)"
    
    if ($subdepartments.Count -gt 0) {
        $selectedSubdept = $subdepartments[0]
        Write-Host "Usando subdepartamento: ID=$($selectedSubdept.id), Nombre='$($selectedSubdept.name)'"
        
        # TEST BRANDS con subdepartment_id
        Write-Host "`n=== TEST BRANDS CON SUBDEPARTMENT_ID ==="
        
        $newBrandName = "TestBrand_SubDept_$(Get-Date -Format 'HHmmss')"
        $brandData = @{
            name = $newBrandName
            subdepartment_id = $selectedSubdept.id
        } | ConvertTo-Json
        
        Write-Host "Enviando: $brandData"
        $postBrandResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/brands" -Body $brandData -Headers $headers
        
        if ($postBrandResponse.Success) {
            $newBrand = $postBrandResponse.Content | ConvertFrom-Json
            Write-Host "Brand creada con subdepartment_id:"
            Write-Host "  ID: $($newBrand.id)"
            Write-Host "  Nombre: $($newBrand.name)"
            Write-Host "  Subdepartment ID: $($newBrand.subdepartment_id)"
        } else {
            Write-Host "Error creando Brand: $($postBrandResponse.Error)"
        }
        
        # TEST ATTRIBUTES con subdepartment_id
        Write-Host "`n=== TEST ATTRIBUTES CON SUBDEPARTMENT_ID ==="
        
        $newAttrName = "TestAttribute_SubDept_$(Get-Date -Format 'HHmmss')"
        $attrData = @{
            name = $newAttrName
            subdepartment_id = $selectedSubdept.id
        } | ConvertTo-Json
        
        Write-Host "Enviando: $attrData"
        $postAttrResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/attributes" -Body $attrData -Headers $headers
        
        if ($postAttrResponse.Success) {
            $newAttr = $postAttrResponse.Content | ConvertFrom-Json
            Write-Host "Attribute creado con subdepartment_id:"
            Write-Host "  ID: $($newAttr.id)"
            Write-Host "  Nombre: $($newAttr.name)"
            Write-Host "  Subdepartment ID: $($newAttr.subdepartment_id)"
        } else {
            Write-Host "Error creando Attribute: $($postAttrResponse.Error)"
        }
        
        # Verificar creacion
        Write-Host "`n=== VERIFICANDO CREACION ==="
        
        $brandsResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/brands" -Headers $headers
        if ($brandsResponse.Success) {
            $brands = $brandsResponse.Content | ConvertFrom-Json
            $brandConSubdept = $brands | Where-Object { $_.subdepartment_id -eq $selectedSubdept.id }
            Write-Host "Brands con subdepartment_id $($selectedSubdept.id): $($brandConSubdept.Count)"
        }
        
        $attrsResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/attributes" -Headers $headers
        if ($attrsResponse.Success) {
            $attrs = $attrsResponse.Content | ConvertFrom-Json
            $attrConSubdept = $attrs | Where-Object { $_.subdepartment_id -eq $selectedSubdept.id }
            Write-Host "Attributes con subdepartment_id $($selectedSubdept.id): $($attrConSubdept.Count)"
        }
        
    } else {
        Write-Host "No se encontraron subdepartamentos para usar"
    }
    
} else {
    Write-Host "Error obteniendo departamentos: $($deptResponse.Error)"
}

Write-Host "`nPRUEBAS CON SUBDEPARTMENT_ID COMPLETADAS!"