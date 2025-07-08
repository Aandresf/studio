
const request = require('supertest');
const { app, server, db } = require('./index');



describe('Reports API', () => {
    it('should generate a sales report', async () => {
        const res = await request(app)
            .post('/api/reports/sales')
            .send({ startDate: '2025-01-01', endDate: '2025-01-31' });

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].type).toBe('SALIDA');
    });

    it('should generate a purchases report', async () => {
        const res = await request(app)
            .post('/api/reports/purchases')
            .send({ startDate: '2025-01-01', endDate: '2025-02-28' });

        expect(res.statusCode).toBe(200);
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
