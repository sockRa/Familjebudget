import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from './index.js';

describe('Security Fix - Input Validation', () => {
    it('GET /api/expenses?year_month=invalid should return 400', async () => {
        const res = await request(app).get('/api/expenses?year_month=invalid');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valideringsfel');
    });

    it('GET /api/expenses?year_month=202401 should return 200', async () => {
        const res = await request(app).get('/api/expenses?year_month=202401');
        expect(res.status).toBe(200);
    });

    it('PUT /api/expenses/invalid should return 400', async () => {
        const res = await request(app).put('/api/expenses/invalid').send({});
        expect(res.status).toBe(400);
    });

    it('GET /api/incomes?yearMonth=invalid should return 400', async () => {
        const res = await request(app).get('/api/incomes?yearMonth=invalid');
        expect(res.status).toBe(400);
    });

    it('GET /api/overview/invalid should return 400', async () => {
        const res = await request(app).get('/api/overview/invalid');
        expect(res.status).toBe(400);
    });

    it('GET /api/statistics/monthly?start=invalid&end=202401 should return 400', async () => {
        const res = await request(app).get('/api/statistics/monthly?start=invalid&end=202401');
        expect(res.status).toBe(400);
    });

    it('GET /api/statistics/monthly?start=202301&end=202201 should return 400 (range error)', async () => {
        const res = await request(app).get('/api/statistics/monthly?start=202301&end=202201');
        expect(res.status).toBe(400);
    });
});
