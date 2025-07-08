const request = require('supertest');
const { app, server, db, shutdown } = require('./index');

describe('API de Productos', () => {

  

  // Prueba para el endpoint POST /api/products
  test('Debería crear un nuevo producto', async () => {
    const newProduct = {
      name: 'Producto de Prueba',
      sku: 'SKU123',
      current_stock: 100,
      average_cost: 10.50
    };

    const response = await request(app)
      .post('/api/products')
      .send(newProduct);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(newProduct.name);
  });

  // Prueba para el endpoint GET /api/products
  test('Debería obtener todos los productos', async () => {
    const response = await request(app).get('/api/products');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0); // Esperamos al menos el producto que creamos antes
  });

  // Prueba para manejar la falta del campo "name"
  test('No debería crear un producto si falta el nombre', async () => {
    const newProduct = { sku: 'SKU456' }; // Sin nombre

    const response = await request(app)
      .post('/api/products')
      .send(newProduct);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Product name is required.');
  });
});