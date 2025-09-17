// Test simple para verificar conectividad del servidor
async function testConnectivity() {
    console.log('🔗 PROBANDO CONECTIVIDAD DEL SERVIDOR');
    console.log('='.repeat(50));

    try {
        // Probar endpoint raíz o health check
        const response = await fetch('http://127.0.0.1:8080/');
        console.log(`📊 Status: ${response.status}`);
        
        if (response.status === 404) {
            console.log('✅ Servidor respondiendo (404 esperado para raíz)');
        } else {
            const text = await response.text();
            console.log(`📦 Response: ${text.substring(0, 100)}...`);
        }
        
        console.log('✅ SERVIDOR RUST ESTÁ FUNCIONANDO');
        
    } catch (error) {
        console.log(`❌ ERROR DE CONECTIVIDAD: ${error.message}`);
    }
    
    console.log('='.repeat(50));
    
    // Ahora probar suppliers directamente para ver el tipo de error
    console.log('\n🧪 PROBANDO SUPPLIERS SIN AUTH');
    console.log('='.repeat(50));
    
    try {
        const response = await fetch('http://127.0.0.1:8080/api/suppliers');
        console.log(`📊 Status suppliers: ${response.status}`);
        
        const text = await response.text();
        console.log(`📦 Response: ${text}`);
        
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }
}

testConnectivity().catch(console.error);