# Script final para cargar datos de prueba con verificacion de errores
Write-Host "=== SCRIPT DE CARGA DE DATOS FINAL ===" -ForegroundColor Green

# Funcion mejorada para hacer requests
function Post-Data {
    param(
        [string]$Uri,
        [string]$Body,
        [hashtable]$Headers = @{},
        [string]$Description
    )
    
    Write-Host "`n--- $Description ---" -ForegroundColor Yellow
    Write-Host "URI: $Uri" -ForegroundColor Gray
    Write-Host "Body: $Body" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Uri -Method POST -ContentType "application/json" -Body $Body -Headers $Headers -UseBasicParsing
        Write-Host "✅ SUCCESS: $($response.StatusCode)" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "Response: $($response.Content)" -ForegroundColor DarkGreen
        return $content
    }
    catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        
        # Intentar obtener detalles del error del servidor
        try {
            $errorResponse = $_.Exception.Response
            if ($errorResponse) {
                $stream = $errorResponse.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $errorBody = $reader.ReadToEnd()
                if ($errorBody) {
                    Write-Host "Error details: $errorBody" -ForegroundColor DarkRed
                }
            }
        } catch {
            # Ignorar errores al leer el error del servidor
        }
        
        return $null
    }
}

# 1. LOGIN
Write-Host "`n=== AUTENTICACION ===" -ForegroundColor Cyan
$loginResult = Post-Data -Uri "http://localhost:8080/api/auth/login" -Body '{"username":"admin","password":"admin"}' -Description "Login como admin"

if (-not $loginResult -or -not $loginResult.token) {
    Write-Host "❌ FALLO EN AUTENTICACION. Terminando." -ForegroundColor Red
    exit 1
}

$token = $loginResult.token
$authHeaders = @{ "Authorization" = "Bearer $token" }
Write-Host "✅ Token obtenido: $($token.Substring(0,30))..." -ForegroundColor Green

# 2. CREAR DEPARTAMENTOS ÚNICOS
Write-Host "`n=== CREANDO DEPARTAMENTOS ===" -ForegroundColor Cyan

# Usar timestamp para hacer nombres únicos
$timestamp = Get-Date -Format "MMddHHmm"

$deptModa = Post-Data -Uri "http://localhost:8080/api/departments" -Body "{`"name`":`"MODA FEMENINA $timestamp`",`"abbreviation`":`"MF$timestamp`"}" -Headers $authHeaders -Description "Departamento MODA FEMENINA"

$deptPerfume = Post-Data -Uri "http://localhost:8080/api/departments" -Body "{`"name`":`"PERFUMERIA $timestamp`",`"abbreviation`":`"PF$timestamp`"}" -Headers $authHeaders -Description "Departamento PERFUMERIA"

$deptAccesorios = Post-Data -Uri "http://localhost:8080/api/departments" -Body "{`"name`":`"ACCESORIOS $timestamp`",`"abbreviation`":`"AC$timestamp`"}" -Headers $authHeaders -Description "Departamento ACCESORIOS"

# 3. CREAR SUBDEPARTAMENTOS
Write-Host "`n=== CREANDO SUBDEPARTAMENTOS ===" -ForegroundColor Cyan

$subdeptVestidos = $null
$subdeptPerfumes = $null
$subdeptBolsos = $null

if ($deptModa -and $deptModa.id) {
    $subdeptVestidos = Post-Data -Uri "http://localhost:8080/api/departments/$($deptModa.id)/subdepartments" -Body "{`"name`":`"Vestidos`",`"abbreviation`":`"VES`"}" -Headers $authHeaders -Description "Subdepartamento Vestidos"
}

if ($deptPerfume -and $deptPerfume.id) {
    $subdeptPerfumes = Post-Data -Uri "http://localhost:8080/api/departments/$($deptPerfume.id)/subdepartments" -Body "{`"name`":`"Fragancias`",`"abbreviation`":`"FRA`"}" -Headers $authHeaders -Description "Subdepartamento Fragancias"
}

if ($deptAccesorios -and $deptAccesorios.id) {
    $subdeptBolsos = Post-Data -Uri "http://localhost:8080/api/departments/$($deptAccesorios.id)/subdepartments" -Body "{`"name`":`"Bolsos`",`"abbreviation`":`"BOL`"}" -Headers $authHeaders -Description "Subdepartamento Bolsos"
}

# 4. CREAR MARCAS
Write-Host "`n=== CREANDO MARCAS ===" -ForegroundColor Cyan

$brandZara = $null
$brandChanel = $null
$brandMK = $null

if ($subdeptVestidos -and $subdeptVestidos.id) {
    $brandZara = Post-Data -Uri "http://localhost:8080/api/brands" -Body "{`"name`":`"Zara $timestamp`",`"subdepartment_id`":$($subdeptVestidos.id)}" -Headers $authHeaders -Description "Marca Zara"
}

if ($subdeptPerfumes -and $subdeptPerfumes.id) {
    $brandChanel = Post-Data -Uri "http://localhost:8080/api/brands" -Body "{`"name`":`"Chanel $timestamp`",`"subdepartment_id`":$($subdeptPerfumes.id)}" -Headers $authHeaders -Description "Marca Chanel"
}

if ($subdeptBolsos -and $subdeptBolsos.id) {
    $brandMK = Post-Data -Uri "http://localhost:8080/api/brands" -Body "{`"name`":`"Michael Kors $timestamp`",`"subdepartment_id`":$($subdeptBolsos.id)}" -Headers $authHeaders -Description "Marca Michael Kors"
}

# 5. CREAR ATRIBUTOS
Write-Host "`n=== CREANDO ATRIBUTOS ===" -ForegroundColor Cyan

$attrTalla = $null
$attrColor = $null
$attrVolumen = $null

if ($subdeptVestidos -and $subdeptVestidos.id) {
    $attrTalla = Post-Data -Uri "http://localhost:8080/api/attributes" -Body "{`"name`":`"Talla`",`"subdepartment_id`":$($subdeptVestidos.id)}" -Headers $authHeaders -Description "Atributo Talla"
    $attrColor = Post-Data -Uri "http://localhost:8080/api/attributes" -Body "{`"name`":`"Color`",`"subdepartment_id`":$($subdeptVestidos.id)}" -Headers $authHeaders -Description "Atributo Color"
}

if ($subdeptPerfumes -and $subdeptPerfumes.id) {
    $attrVolumen = Post-Data -Uri "http://localhost:8080/api/attributes" -Body "{`"name`":`"Volumen`",`"subdepartment_id`":$($subdeptPerfumes.id)}" -Headers $authHeaders -Description "Atributo Volumen"
}

# 6. CREAR VALORES DE ATRIBUTOS
Write-Host "`n=== CREANDO VALORES DE ATRIBUTOS ===" -ForegroundColor Cyan

if ($attrTalla -and $attrTalla.id) {
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attrTalla.id),`"value`":`"S`"}" -Headers $authHeaders -Description "Valor S" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attrTalla.id),`"value`":`"M`"}" -Headers $authHeaders -Description "Valor M" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attrTalla.id),`"value`":`"L`"}" -Headers $authHeaders -Description "Valor L" | Out-Null
}

if ($attrColor -and $attrColor.id) {
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attrColor.id),`"value`":`"Negro`"}" -Headers $authHeaders -Description "Valor Negro" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attrColor.id),`"value`":`"Blanco`"}" -Headers $authHeaders -Description "Valor Blanco" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attrColor.id),`"value`":`"Azul`"}" -Headers $authHeaders -Description "Valor Azul" | Out-Null
}

if ($attrVolumen -and $attrVolumen.id) {
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attrVolumen.id),`"value`":`"50ml`"}" -Headers $authHeaders -Description "Valor 50ml" | Out-Null
    Post-Data -Uri "http://localhost:8080/api/attribute-values" -Body "{`"attribute_id`":$($attrVolumen.id),`"value`":`"100ml`"}" -Headers $authHeaders -Description "Valor 100ml" | Out-Null
}

# 7. CREAR CLIENTES
Write-Host "`n=== CREANDO CLIENTES ===" -ForegroundColor Cyan

Post-Data -Uri "http://localhost:8080/api/customers" -Body "{`"name`":`"Maria Garcia $timestamp`",`"document`":`"12345678A`",`"email`":`"maria$timestamp@email.com`",`"phone`":`"600123456`",`"address`":`"Calle Mayor 123`"}" -Headers $authHeaders -Description "Cliente Maria Garcia" | Out-Null

Post-Data -Uri "http://localhost:8080/api/customers" -Body "{`"name`":`"Carlos Lopez $timestamp`",`"document`":`"87654321B`",`"email`":`"carlos$timestamp@email.com`",`"phone`":`"600234567`",`"address`":`"Avenida Central 456`"}" -Headers $authHeaders -Description "Cliente Carlos Lopez" | Out-Null

Write-Host "`n🎉 === CARGA DE DATOS COMPLETADA === 🎉" -ForegroundColor Green
Write-Host "Timestamp usado: $timestamp" -ForegroundColor Yellow

# 8. VERIFICACION FINAL
Write-Host "`n=== VERIFICACION FINAL ===" -ForegroundColor Cyan

Write-Host "Verificando datos creados..." -ForegroundColor Yellow

$finalDepts = Invoke-WebRequest -Uri "http://localhost:8080/api/departments" -Headers $authHeaders -UseBasicParsing
Write-Host "Departamentos: $($finalDepts.Content)" -ForegroundColor DarkGreen

$finalBrands = Invoke-WebRequest -Uri "http://localhost:8080/api/brands" -Headers $authHeaders -UseBasicParsing
Write-Host "Marcas: $($finalBrands.Content)" -ForegroundColor DarkGreen

$finalCustomers = Invoke-WebRequest -Uri "http://localhost:8080/api/customers" -Headers $authHeaders -UseBasicParsing
Write-Host "Clientes: $($finalCustomers.Content)" -ForegroundColor DarkGreen

Write-Host "`n✅ SCRIPT COMPLETADO - Datos de prueba listos para testing!" -ForegroundColor Green