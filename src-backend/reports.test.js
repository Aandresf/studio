
const request = require('supertest');
const { app, db } = require('./index');

describe('Reports API', () => {
    beforeEach(async () => {
        // Clear all data
        await new Promise((resolve) => db.exec("DELETE FROM inventory_movements; DELETE FROM products; PRAGMA sqlite_sequence(name='products', seq=0); PRAGMA sqlite_sequence(name='inventory_movements', seq=0);", resolve));

        // Create products
        const p1 = await request(app).post('/api/products').send({ name: 'P1', sku: 'P1', current_stock: 10, average_cost: 10 });
        const p2 = await request(app).post('/api/products').send({ name: 'P2', sku: 'P2', current_stock: 20, average_cost: 20 });

        // Create movements
        await request(app).post('/api/inventory/movements').send({ product_id: p1.body.id, type: 'ENTRADA', quantity: 5, unit_cost: 12, date: '2025-01-10 10:00:00' });
        await request(app).post('/api/inventory/movements').send({ product_id: p2.body.id, type: 'ENTRADA', quantity: 10, unit_cost: 22, date: '2025-02-05 11:30:00' });
        await request(app).post('/api/inventory/movements').send({ product_id: p1.body.id, type: 'SALIDA', quantity: 2, unit_cost: null, date: '2025-01-20 15:00:00' });
    });

    it('should generate a sales report', async () => {
        const res = await request(app)
            .post('/api/reports/sales')
            .send({ startDate: '2025-01-01', endDate: '2025-01-31' });

        expect(res.statusCode).toBe(201);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].type).toBe('SALIDA');
    });

    it('should generate a purchases report', async () => {
        const res = await request(app)
            .post('/api/reports/purchases')
            .send({ startDate: '2025-01-01', endDate: '2025-02-28' });

        expect(res.statusCode).toBe(201);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body[0].type).toBe('ENTRADA');
    });

    it('should return 400 for invalid report type', async () => {
        const res = await request(app)
            .post('/api/reports/invalid')
            .send({ startDate: '2025-01-01', endDate: '2025-01-31' });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Invalid report type');
    });
});
