const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

const testProduct = {
    name: "Laptop Gamer E2E",
    sku: "LGP-E2E-02",
    current_stock: 10,
    average_cost: 1500
};

let productId; // To store the ID of the created product

const runTest = async () => {
    try {
        // --- 1. Create Product ---
        console.log('PASO 1: Creando producto...');
        const createRes = await axios.post(`${API_BASE_URL}/products`, testProduct);
        if (createRes.status !== 201 || !createRes.data.id) {
            throw new Error(`Fallo al crear producto. Status: ${createRes.status}`);
        }
        productId = createRes.data.id;
        console.log(`  -> Éxito. Producto creado con ID: ${productId}`);

        // --- 2. Verify Product ---
        console.log('PASO 2: Verificando producto...');
        const getRes1 = await axios.get(`${API_BASE_URL}/products/${productId}`);
        if (getRes1.status !== 200 || getRes1.data.name !== testProduct.name) {
            throw new Error(`Fallo al verificar producto. Status: ${getRes1.status}`);
        }
        console.log(`  -> Éxito. Producto "${getRes1.data.name}" encontrado.`);

        // --- 3. Update Product ---
        console.log('PASO 3: Actualizando producto...');
        const updatedProductData = { ...testProduct, name: "Laptop Gamer E2E (Actualizada)" };
        const updateRes = await axios.put(`${API_BASE_URL}/products/${productId}`, updatedProductData);
        if (updateRes.status !== 200) {
            throw new Error(`Fallo al actualizar producto. Status: ${updateRes.status}`);
        }
        const getRes2 = await axios.get(`${API_BASE_URL}/products/${productId}`);
        if (getRes2.data.name !== "Laptop Gamer E2E (Actualizada)") {
             throw new Error('La verificación post-actualización falló.');
        }
        console.log(`  -> Éxito. Producto actualizado a: "${getRes2.data.name}"`);

        // --- 4. Register Purchase (ENTRADA) ---
        console.log('PASO 4: Registrando compra (ENTRADA)...');
        const purchaseMovement = { product_id: productId, type: 'ENTRADA', quantity: 5, unit_cost: 1550 };
        const purchaseRes = await axios.post(`${API_BASE_URL}/inventory/movements`, purchaseMovement);
        if (purchaseRes.status !== 201) {
            throw new Error(`Fallo al registrar compra. Status: ${purchaseRes.status}`);
        }
        console.log('  -> Éxito. Movimiento de compra registrado.');

        // --- 5. Verify Stock (Post-Purchase) ---
        console.log('PASO 5: Verificando stock post-compra...');
        const getRes3 = await axios.get(`${API_BASE_URL}/products/${productId}`);
        const expectedStock1 = testProduct.current_stock + purchaseMovement.quantity;
        if (getRes3.data.current_stock !== expectedStock1) {
            throw new Error(`Fallo en verificación de stock. Esperado: ${expectedStock1}, Obtenido: ${getRes3.data.current_stock}`);
        }
        console.log(`  -> Éxito. Stock actualizado a: ${getRes3.data.current_stock}`);

        // --- 6. Register Sale (SALIDA) ---
        console.log('PASO 6: Registrando venta (SALIDA)...');
        const saleMovement = { product_id: productId, type: 'SALIDA', quantity: 2 };
        const saleRes = await axios.post(`${API_BASE_URL}/inventory/movements`, saleMovement);
        if (saleRes.status !== 201) {
            throw new Error(`Fallo al registrar venta. Status: ${saleRes.status}`);
        }
        console.log('  -> Éxito. Movimiento de venta registrado.');

        // --- 7. Verify Stock (Post-Sale) ---
        console.log('PASO 7: Verificando stock post-venta...');
        const getRes4 = await axios.get(`${API_BASE_URL}/products/${productId}`);
        const expectedStock2 = expectedStock1 - saleMovement.quantity;
        if (getRes4.data.current_stock !== expectedStock2) {
            throw new Error(`Fallo en verificación de stock. Esperado: ${expectedStock2}, Obtenido: ${getRes4.data.current_stock}`);
        }
        console.log(`  -> Éxito. Stock final es: ${getRes4.data.current_stock}`);

        // --- 8. Generate Report ---
        console.log('PASO 8: Generando reporte de ventas...');
        const today = new Date().toISOString().slice(0, 10);
        const reportRes = await axios.post(`${API_BASE_URL}/reports/sales`, { startDate: today, endDate: today });
        if (reportRes.status !== 201 || !reportRes.data.report_data) {
             throw new Error(`Fallo al generar reporte. Status: ${reportRes.status}`);
        }
        const reportData = JSON.parse(reportRes.data.report_data);
        if (!Array.isArray(reportData) || reportData.length === 0) {
            throw new Error('El reporte de ventas está vacío o no es un array.');
        }
        console.log(`  -> Éxito. Reporte generado con ${reportData.length} venta(s).`);

        console.log('\n*** ¡Prueba E2E completada con éxito! ***');

    } catch (error) {
        console.error('\n*** ERROR DURANTE LA PRUEBA E2E ***');
        console.error(error.message);
        if(error.response) {
            console.error('Respuesta del servidor:', error.response.data);
        }
    } finally {
        // --- 9. Cleanup ---
        if (productId) {
            try {
                console.log(`\nPASO 9: Limpiando producto de prueba (ID: ${productId})...`);
                await axios.delete(`${API_BASE_URL}/products/${productId}`);
                console.log('  -> Éxito. Producto de prueba eliminado.');
            } catch (cleanupError) {
                console.error('Error durante la limpieza:', cleanupError.message);
            }
        }
    }
};

runTest();