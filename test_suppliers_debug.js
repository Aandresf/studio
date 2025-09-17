#!/usr/bin/env node

// Script simple para debuggear suppliers endpoint
const BASE_URL = 'http://localhost:8080/api';

async function makeRequest(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc1ODEzNDM3MCwiaWF0IjoxNzU4MDQ3OTcwLCJyb2xlX2lkIjoiaHhzSmg2T2FqMCIsInVzZXJfaWQiOiJrQVYwYUhrUW5WIn0.s__Hvz8aAJ5ANCySlnEIH7l49NlJG-63BE-luimbLU0',
            ...options.headers
        },
        ...options
    });
    
    const result = {
        status: response.status,
        statusText: response.statusText,
    };
    
    try {
        const text = await response.text();
        if (text) {
            try {
                result.data = JSON.parse(text);
            } catch (parseError) {
                result.text = text;
            }
        }
    } catch (error) {
        result.text = '';
    }
    
    return result;
}

async function testSuppliers() {
    console.log('🔍 Testeando endpoints de suppliers...');
    
    // Test different possible URLs
    const urls = [
        '/suppliers',
        '/api/suppliers',
        '/suppliers/',
        '/api/suppliers/'
    ];
    
    for (const url of urls) {
        const fullUrl = url.startsWith('/api') ? `http://localhost:8080${url}` : `${BASE_URL}${url}`;
        console.log(`\n=== GET ${fullUrl} ===`);
        const result = await makeRequest(fullUrl);
        console.log(`Status: ${result.status} ${result.statusText}`);
        if (result.data) {
            console.log('Data:', JSON.stringify(result.data, null, 2));
        } else if (result.text) {
            console.log('Text:', result.text);
        }
    }
}

testSuppliers();