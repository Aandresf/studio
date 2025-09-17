# Script para cargar datos de prueba - Tienda de Moda y Accesorios
# Carga datos realistas para una tienda que vende ropa, perfumes, collares y accesorios

Write-Host "=== INICIANDO CARGA DE DATOS DE PRUEBA ===" -ForegroundColor Green
Write-Host "Tienda: Moda & Estilo - Ropa, Perfumes y Accesorios" -ForegroundColor Cyan

# Función para hacer solicitudes HTTP con logs detallados
function Invoke-ApiCall {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [string]$ContentType = "application/json",
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$Description
    )
    
    Write-Host "`n--- $Description ---" -ForegroundColor Yellow
    Write-Host "URI: $Uri" -ForegroundColor Gray
    Write-Host "Method: $Method" -ForegroundColor Gray
    if ($Body) {
        Write-Host "Body: $Body" -ForegroundColor Gray
    }
    
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            ContentType = $ContentType
            Headers = $Headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "✅ SUCCESS - Status: $($response.StatusCode)" -ForegroundColor Green
        
        if ($response.Content) {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "Response: $($response.Content)" -ForegroundColor DarkGreen
            return $content
        }
        return $true
    }
    catch {
        Write-Host "❌ ERROR - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor DarkRed
        }
        return $false
    }
}

# 1. AUTENTICACIÓN
Write-Host "`n=== 1. AUTENTICACIÓN ===" -ForegroundColor Cyan
$loginResult = Invoke-ApiCall -Uri "http://localhost:8080/api/auth/login" -Method "POST" -Body '{"username":"admin","password":"admin"}' -Description "Autenticar admin"

if (-not $loginResult) {
    Write-Host "❌ FALLÓ LA AUTENTICACIÓN. Abortando." -ForegroundColor Red
    exit 1
}

$token = $loginResult.token
$authHeaders = @{ "Authorization" = "Bearer $token" }
Write-Host "✅ Token obtenido: $($token.Substring(0,20))..." -ForegroundColor Green

# 2. CREAR DEPARTAMENTOS
Write-Host "`n=== 2. CREAR DEPARTAMENTOS ===" -ForegroundColor Cyan

$departments = @(
    @{ name = "MODA FEMENINA"; abbreviation = "MF" },
    @{ name = "MODA MASCULINA"; abbreviation = "MM" },
    @{ name = "PERFUMERÍA"; abbreviation = "PF" },
    @{ name = "ACCESORIOS"; abbreviation = "AC" },
    @{ name = "JOYAS Y BISUTERÍA"; abbreviation = "JB" }
)

$departmentIds = @{}
foreach ($dept in $departments) {
    $body = @{
        name = $dept.name
        abbreviation = $dept.abbreviation
    } | ConvertTo-Json
    
    $result = Invoke-ApiCall -Uri "http://localhost:8080/api/departments" -Method "POST" -Body $body -Headers $authHeaders -Description "Crear departamento: $($dept.name)"
    if ($result) {
        $departmentIds[$dept.abbreviation] = $result.id
        Write-Host "Departamento '$($dept.name)' creado con ID: $($result.id)" -ForegroundColor DarkGreen
    }
}

# 3. CREAR SUBDEPARTAMENTOS
Write-Host "`n=== 3. CREAR SUBDEPARTAMENTOS ===" -ForegroundColor Cyan

$subdepartments = @(
    # Moda Femenina
    @{ name = "Vestidos"; abbreviation = "VES"; department = "MF" },
    @{ name = "Blusas"; abbreviation = "BLU"; department = "MF" },
    @{ name = "Pantalones"; abbreviation = "PAN"; department = "MF" },
    @{ name = "Faldas"; abbreviation = "FAL"; department = "MF" },
    
    # Moda Masculina  
    @{ name = "Camisas"; abbreviation = "CAM"; department = "MM" },
    @{ name = "Pantalones"; abbreviation = "PAN"; department = "MM" },
    @{ name = "Camisetas"; abbreviation = "CAM"; department = "MM" },
    
    # Perfumería
    @{ name = "Fragancias Femeninas"; abbreviation = "FRF"; department = "PF" },
    @{ name = "Fragancias Masculinas"; abbreviation = "FRM"; department = "PF" },
    @{ name = "Fragancias Unisex"; abbreviation = "FRU"; department = "PF" },
    
    # Accesorios
    @{ name = "Bolsos"; abbreviation = "BOL"; department = "AC" },
    @{ name = "Carteras"; abbreviation = "CAR"; department = "AC" },
    @{ name = "Cinturones"; abbreviation = "CIN"; department = "AC" },
    
    # Joyas y Bisutería
    @{ name = "Collares"; abbreviation = "COL"; department = "JB" },
    @{ name = "Pulseras"; abbreviation = "PUL"; department = "JB" },
    @{ name = "Aretes"; abbreviation = "ARE"; department = "JB" },
    @{ name = "Anillos"; abbreviation = "ANI"; department = "JB" }
)

$subdepartmentIds = @{}
foreach ($subdept in $subdepartments) {
    $deptId = $departmentIds[$subdept.department]
    if ($deptId) {
        $body = @{
            name = $subdept.name
            abbreviation = $subdept.abbreviation
            department_id = $deptId
        } | ConvertTo-Json
        
        $result = Invoke-ApiCall -Uri "http://localhost:8080/api/subdepartments" -Method "POST" -Body $body -Headers $authHeaders -Description "Crear subdepartamento: $($subdept.name)"
        if ($result) {
            $subdepartmentIds["$($subdept.department)-$($subdept.abbreviation)"] = $result.id
            Write-Host "Subdepartamento '$($subdept.name)' creado con ID: $($result.id)" -ForegroundColor DarkGreen
        }
    }
}

# 4. CREAR MARCAS
Write-Host "`n=== 4. CREAR MARCAS ===" -ForegroundColor Cyan

$brands = @(
    # Marcas de ropa femenina
    @{ name = "Zara"; subdepartment = "MF-VES" },
    @{ name = "H`&M"; subdepartment = "MF-BLU" },
    @{ name = "Forever 21"; subdepartment = "MF-PAN" },
    
    # Marcas de ropa masculina
    @{ name = "Hugo Boss"; subdepartment = "MM-CAM" },
    @{ name = "Polo Ralph Lauren"; subdepartment = "MM-PAN" },
    @{ name = "Tommy Hilfiger"; subdepartment = "MM-CAM" },
    
    # Marcas de perfumes
    @{ name = "Chanel"; subdepartment = "PF-FRF" },
    @{ name = "Dior"; subdepartment = "PF-FRF" },
    @{ name = "Calvin Klein"; subdepartment = "PF-FRM" },
    @{ name = "Giorgio Armani"; subdepartment = "PF-FRM" },
    @{ name = "CK One"; subdepartment = "PF-FRU" },
    
    # Marcas de accesorios
    @{ name = "Michael Kors"; subdepartment = "AC-BOL" },
    @{ name = "Coach"; subdepartment = "AC-CAR" },
    @{ name = "Guess"; subdepartment = "AC-CIN" },
    
    # Marcas de joyería
    @{ name = "Pandora"; subdepartment = "JB-COL" },
    @{ name = "Swarovski"; subdepartment = "JB-PUL" },
    @{ name = "Tous"; subdepartment = "JB-ARE" }
)

$brandIds = @{}
foreach ($brand in $brands) {
    $subdeptId = $subdepartmentIds[$brand.subdepartment]
    if ($subdeptId) {
        $body = @{
            name = $brand.name
            subdepartment_id = $subdeptId
        } | ConvertTo-Json
        
        $result = Invoke-ApiCall -Uri "http://localhost:8080/api/brands" -Method "POST" -Body $body -Headers $authHeaders -Description "Crear marca: $($brand.name)"
        if ($result) {
            $brandIds["$($brand.subdepartment)-$($brand.name)"] = $result.id
            Write-Host "Marca '$($brand.name)' creada con ID: $($result.id)" -ForegroundColor DarkGreen
        }
    }
}

# 5. CREAR ATRIBUTOS
Write-Host "`n=== 5. CREAR ATRIBUTOS ===" -ForegroundColor Cyan

$attributes = @(
    # Atributos para ropa
    @{ name = "Talla"; subdepartments = @("MF-VES", "MF-BLU", "MF-PAN", "MF-FAL", "MM-CAM", "MM-PAN", "MM-CAM") },
    @{ name = "Color"; subdepartments = @("MF-VES", "MF-BLU", "MF-PAN", "MF-FAL", "MM-CAM", "MM-PAN", "MM-CAM", "AC-BOL", "AC-CAR", "AC-CIN", "JB-COL", "JB-PUL", "JB-ARE", "JB-ANI") },
    @{ name = "Material"; subdepartments = @("MF-VES", "MF-BLU", "MF-PAN", "MF-FAL", "MM-CAM", "MM-PAN", "MM-CAM", "AC-BOL", "AC-CAR", "AC-CIN") },
    
    # Atributos para perfumes
    @{ name = "Volumen"; subdepartments = @("PF-FRF", "PF-FRM", "PF-FRU") },
    @{ name = "Tipo de Fragancia"; subdepartments = @("PF-FRF", "PF-FRM", "PF-FRU") },
    
    # Atributos para joyería
    @{ name = "Material Joya"; subdepartments = @("JB-COL", "JB-PUL", "JB-ARE", "JB-ANI") },
    @{ name = "Longitud"; subdepartments = @("JB-COL", "JB-PUL") }
)

$attributeIds = @{}
foreach ($attr in $attributes) {
    foreach ($subdeptKey in $attr.subdepartments) {
        $subdeptId = $subdepartmentIds[$subdeptKey]
        if ($subdeptId) {
            $body = @{
                name = $attr.name
                subdepartment_id = $subdeptId
            } | ConvertTo-Json
            
            $result = Invoke-ApiCall -Uri "http://localhost:8080/api/attributes" -Method "POST" -Body $body -Headers $authHeaders -Description "Crear atributo: $($attr.name) para $subdeptKey"
            if ($result) {
                $attributeIds["$subdeptKey-$($attr.name)"] = $result.id
                Write-Host "Atributo '$($attr.name)' creado para $subdeptKey con ID: $($result.id)" -ForegroundColor DarkGreen
            }
        }
    }
}

# 6. CREAR VALORES DE ATRIBUTOS
Write-Host "`n=== 6. CREAR VALORES DE ATRIBUTOS ===" -ForegroundColor Cyan

$attributeValues = @{
    "Talla" = @("XS", "S", "M", "L", "XL", "XXL")
    "Color" = @("Negro", "Blanco", "Azul", "Rojo", "Verde", "Amarillo", "Rosa", "Gris", "Beige", "Marrón", "Dorado", "Plateado")
    "Material" = @("Algodón", "Poliéster", "Seda", "Lino", "Cuero", "Denim", "Lana")
    "Volumen" = @("30ml", "50ml", "100ml", "125ml", "150ml")
    "Tipo de Fragancia" = @("Floral", "Oriental", "Cítrico", "Amaderado", "Fresco", "Especiado")
    "Material Joya" = @("Oro 18k", "Plata 925", "Acero Inoxidable", "Bisutería", "Oro Laminado")
    "Longitud" = @("40cm", "45cm", "50cm", "55cm", "60cm", "18cm", "20cm", "22cm")
}

foreach ($attrId in $attributeIds.Keys) {
    $parts = $attrId -split "-"
    $attrName = $parts[2]
    $attributeDbId = $attributeIds[$attrId]
    
    if ($attributeValues.ContainsKey($attrName)) {
        foreach ($value in $attributeValues[$attrName]) {
            $body = @{
                attribute_id = $attributeDbId
                value = $value
            } | ConvertTo-Json
            
            $result = Invoke-ApiCall -Uri "http://localhost:8080/api/attribute-values" -Method "POST" -Body $body -Headers $authHeaders -Description "Crear valor '$value' para atributo $attrName"
            if ($result) {
                Write-Host "Valor '$value' creado para atributo $attrName" -ForegroundColor DarkGreen
            }
        }
    }
}

# 7. CREAR CLIENTES DE PRUEBA
Write-Host "`n=== 7. CREAR CLIENTES DE PRUEBA ===" -ForegroundColor Cyan

$customers = @(
    @{ name = "María García"; document = "12345678A"; email = "maria.garcia@email.com"; phone = "+34 600 123 456"; address = "Calle Mayor 123, Madrid" },
    @{ name = "Carlos López"; document = "87654321B"; email = "carlos.lopez@email.com"; phone = "+34 600 234 567"; address = "Avenida Central 456, Barcelona" },
    @{ name = "Ana Martínez"; document = "11223344C"; email = "ana.martinez@email.com"; phone = "+34 600 345 678"; address = "Plaza España 789, Valencia" },
    @{ name = "David Rodríguez"; document = "44332211D"; email = "david.rodriguez@email.com"; phone = "+34 600 456 789"; address = "Paseo Gracia 321, Sevilla" },
    @{ name = "Laura Fernández"; document = "55667788E"; email = "laura.fernandez@email.com"; phone = "+34 600 567 890"; address = "Gran Vía 654, Bilbao" }
)

foreach ($customer in $customers) {
    $body = $customer | ConvertTo-Json
    $result = Invoke-ApiCall -Uri "http://localhost:8080/api/customers" -Method "POST" -Body $body -Headers $authHeaders -Description "Crear cliente: $($customer.name)"
    if ($result) {
        Write-Host "Cliente '$($customer.name)' creado con ID: $($result.id)" -ForegroundColor DarkGreen
    }
}

Write-Host "`n🎉 === CARGA DE DATOS COMPLETADA === 🎉" -ForegroundColor Green
Write-Host "✅ Departamentos creados: $($departments.Count)" -ForegroundColor Cyan
Write-Host "✅ Subdepartamentos creados: $($subdepartments.Count)" -ForegroundColor Cyan  
Write-Host "✅ Marcas creadas: $($brands.Count)" -ForegroundColor Cyan
Write-Host "✅ Atributos y valores creados" -ForegroundColor Cyan
Write-Host "✅ Clientes de prueba creados: $($customers.Count)" -ForegroundColor Cyan

Write-Host "`n📊 La base de datos ahora contiene datos realistas para probar todos los endpoints!" -ForegroundColor Yellow