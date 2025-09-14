
const request = require('supertest');
const { app, db } = require('./index');

describe('Inventory Movements API', () => {
    let productId;

    beforeEach(async () => {
        // Clear all data
        await new Promise((resolve) => db.exec("DELETE FROM inventory_movements; DELETE FROM products; PRAGMA sqlite_sequence(name='products', seq=0); PRAGMA sqlite_sequence(name='inventory_movements', seq=0);", resolve));

        // Create a product using the API to ensure a valid state
        const productRes = await request(app)
            .post('/api/products')
            .send({ name: 'Test Product', sku: 'TP-001', current_stock: 10, average_cost: 20 });
        productId = productRes.body.id;
    });

    it('should register an IN movement and update product stock and cost', async () => {
        const movement = {
            product_id: productId,
            type: 'ENTRADA',
            quantity: 5,
            unit_cost: 22,
            description: 'Purchase from supplier'
        };
        const res = await request(app)
            .post('/api/inventory/movements')
            .send(movement);

        expect(res.statusCode).toBe(201);

        const productRes = await request(app).get(`/api/products/${productId}`);
        expect(productRes.body.current_stock).toBe(15); // 10 + 5
        expect(productRes.body.average_cost).toBeCloseTo(20.67, 2); // ((10 * 20) + (5 * 22)) / 15
    });

    it('should register an OUT movement and update product stock', async () => {
        const movement = {
            product_id: productId,
            type: 'SALIDA',
            quantity: 3,
            unit_cost: null, // Not needed for sales
            description: 'Sale to customer'
        };
        const res = await request(app)
            .post('/api/inventory/movements')
            .send(movement);

        expect(res.statusCode).toBe(201);

        const productRes = await request(app).get(`/api/products/${productId}`);
        expect(productRes.body.current_stock).toBe(7); // 10 - 3
        expect(productRes.body.average_cost).toBe(20); // Cost doesn't change on sale
    });

    it('should not allow an OUT movement if stock is insufficient', async () => {
        const movement = {
            product_id: productId,
            type: 'SALIDA',
            quantity: 15, // More than available stock
            description: 'Sale attempt'
        };
        const res = await request(app)
            .post('/api/inventory/movements')
            .send(movement);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Insufficient stock');
    });
});
