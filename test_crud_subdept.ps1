# Script para probar CRUD de marcas y atributos con subdepartment_id
$baseUrl = "http://127.0.0.1:8080/api"

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

Write-Host "=== AUTENTICACION ===" -ForegroundColor Yellow
$loginData = '{"username":"admin","password":"admin"}'
$authResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/auth/login" -Body $loginData

if ($authResponse.Success) {
    $authResult = $authResponse.Content | ConvertFrom-Json
    $headers = @{"Authorization" = "Bearer $($authResult.token)"}
    Write-Host "✅ Autenticación exitosa" -ForegroundColor Green
} else {
    Write-Host "❌ Error en autenticación: $($authResponse.Error)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== OBTENIENDO DEPARTAMENTOS Y SUBDEPARTAMENTOS ===" -ForegroundColor Yellow
$deptResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/departments" -Headers $headers

if ($deptResponse.Success) {
    $departments = $deptResponse.Content | ConvertFrom-Json
    Write-Host "✅ Departamentos obtenidos: $($departments.Count)" -ForegroundColor Green
    
    # Buscar subdepartamentos disponibles
    $subdepartments = @()
    foreach ($dept in $departments) {
        if ($dept.subdepartments -and $dept.subdepartments.Count -gt 0) {
            $subdepartments += $dept.subdepartments
        }
    }
    
    Write-Host "📋 Subdepartamentos encontrados: $($subdepartments.Count)" -ForegroundColor Cyan
    
    if ($subdepartments.Count -gt 0) {
        $selectedSubdept = $subdepartments[0]
        Write-Host "🎯 Usando subdepartamento: ID=$($selectedSubdept.id), Nombre='$($selectedSubdept.name)'" -ForegroundColor Cyan
        
        # TEST BRANDS con subdepartment_id
        Write-Host "`n=== TEST BRANDS CON SUBDEPARTMENT_ID ===" -ForegroundColor Yellow
        
        $newBrandName = "TestBrand_SubDept_$(Get-Date -Format 'HHmmss')"
        $brandData = @{
            name = $newBrandName
            subdepartment_id = $selectedSubdept.id
        } | ConvertTo-Json
        
        Write-Host "Enviando: $brandData" -ForegroundColor Gray
        $postBrandResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/brands" -Body $brandData -Headers $headers
        
        if ($postBrandResponse.Success) {
            $newBrand = $postBrandResponse.Content | ConvertFrom-Json
            Write-Host "✅ Brand creada con subdepartment_id:" -ForegroundColor Green
            Write-Host "  ID: $($newBrand.id)" -ForegroundColor White
            Write-Host "  Nombre: $($newBrand.name)" -ForegroundColor White
            Write-Host "  Subdepartment ID: $($newBrand.subdepartment_id)" -ForegroundColor White
        } else {
            Write-Host "❌ Error creando Brand: $($postBrandResponse.Error)" -ForegroundColor Red
        }
        
        # TEST ATTRIBUTES con subdepartment_id
        Write-Host "`n=== TEST ATTRIBUTES CON SUBDEPARTMENT_ID ===" -ForegroundColor Yellow
        
        $newAttrName = "TestAttribute_SubDept_$(Get-Date -Format 'HHmmss')"
        $attrData = @{
            name = $newAttrName
            subdepartment_id = $selectedSubdept.id
        } | ConvertTo-Json
        
        Write-Host "Enviando: $attrData" -ForegroundColor Gray
        $postAttrResponse = Invoke-ApiRequest -Method "POST" -Url "$baseUrl/attributes" -Body $attrData -Headers $headers
        
        if ($postAttrResponse.Success) {
            $newAttr = $postAttrResponse.Content | ConvertFrom-Json
            Write-Host "✅ Attribute creado con subdepartment_id:" -ForegroundColor Green
            Write-Host "  ID: $($newAttr.id)" -ForegroundColor White
            Write-Host "  Nombre: $($newAttr.name)" -ForegroundColor White
            Write-Host "  Subdepartment ID: $($newAttr.subdepartment_id)" -ForegroundColor White
        } else {
            Write-Host "❌ Error creando Attribute: $($postAttrResponse.Error)" -ForegroundColor Red
        }
        
        # Verificar que se crearon correctamente
        Write-Host "`n=== VERIFICANDO CREACION ===" -ForegroundColor Yellow
        
        $brandsResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/brands" -Headers $headers
        if ($brandsResponse.Success) {
            $brands = $brandsResponse.Content | ConvertFrom-Json
            $brandConSubdept = $brands | Where-Object { $_.subdepartment_id -eq $selectedSubdept.id }
            Write-Host "✅ Brands con subdepartment_id $($selectedSubdept.id): $($brandConSubdept.Count)" -ForegroundColor Green
        }
        
        $attrsResponse = Invoke-ApiRequest -Method "GET" -Url "$baseUrl/attributes" -Headers $headers
        if ($attrsResponse.Success) {
            $attrs = $attrsResponse.Content | ConvertFrom-Json
            $attrConSubdept = $attrs | Where-Object { $_.subdepartment_id -eq $selectedSubdept.id }
            Write-Host "✅ Attributes con subdepartment_id $($selectedSubdept.id): $($attrConSubdept.Count)" -ForegroundColor Green
        }
        
    } else {
        Write-Host "⚠️  No se encontraron subdepartamentos para usar" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Error obteniendo departamentos: $($deptResponse.Error)" -ForegroundColor Red
}

Write-Host "`n*** PRUEBAS CON SUBDEPARTMENT_ID COMPLETADAS!" -ForegroundColor Green