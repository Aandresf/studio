#!/usr/bin/env node

// Script simple para probar conectividad
const BASE_URL = 'http://localhost:8080';

async function testConnectivity() {
    console.log('🔍 Probando conectividad con el servidor...');
    
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const result = {
            status: response.status,
            statusText: response.statusText
        };
        
        try {
            const text = await response.text();
            if (text) {
                result.data = JSON.parse(text);
            }
        } catch (error) {
            result.text = '';
        }
        
        console.log('=== GET /health ===');
        console.log(`Status: ${result.status} ${result.statusText}`);
        if (result.data) {
            console.log('Data:', JSON.stringify(result.data, null, 2));
        }
        
        // Probar endpoint de login sin credenciales
        console.log('\n=== POST /auth/login (sin datos) ===');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        console.log(`Status: ${loginResponse.status} ${loginResponse.statusText}`);
        const loginText = await loginResponse.text();
        if (loginText) {
            try {
                console.log('Data:', JSON.stringify(JSON.parse(loginText), null, 2));
            } catch {
                console.log('Text:', loginText);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testConnectivity();