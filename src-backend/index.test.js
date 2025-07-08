const request = require('supertest');
const { app, server, db, shutdown } = require('./index');

describe('API de Productos', () => {

  // Antes de todas las pruebas, nos aseguramos de que la tabla exista
  beforeAll((done) => {
    db.serialize(() => {
      // Recreamos la tabla para asegurar un estado limpio
      db.run("DROP TABLE IF EXISTS products");
      db.run(`
        CREATE TABLE products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          sku TEXT,
          current_stock REAL DEFAULT 0,
          average_cost REAL DEFAULT 0
        );
      `, done);
    });
  });

  // Después de todas las pruebas, cerramos el servidor y la conexión a la BD
  afterAll((done) => {
    // Usamos un callback para asegurar que Jest espere a que todo se cierre
    server.close(() => {
      db.close(done);
    });
  });

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
    expect(response.body).toHaveProperty('error', 'El campo "name" es requerido.');
  });
});