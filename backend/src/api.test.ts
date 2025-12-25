import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from './index.js';
import db from './db/sqlite.js';

describe('API Routes', () => {
    beforeEach(() => {
        db.exec('DELETE FROM expenses');
        db.exec('DELETE FROM incomes');
        db.exec('DELETE FROM categories');
        db.exec("DELETE FROM sqlite_sequence WHERE name IN ('expenses', 'incomes', 'categories')");
    });

    describe('GET /api/health', () => {
        it('should return 200 ok', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });
    });

    describe('Incomes API', () => {
        it('should create a new income', async () => {
            const res = await request(app)
                .post('/api/incomes')
                .send({
                    name: 'Test Income',
                    owner: 'jag',
                    amount: 1000,
                    year_month: 202312
                });

            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Test Income');
            expect(res.body.owner).toBe('jag');
            expect(res.body.amount).toBe(1000);
            expect(res.body.year_month).toBe(202312);
            expect(typeof res.body.id).toBe('number');
        });

        it('should fail if owner is invalid', async () => {
            const res = await request(app)
                .post('/api/incomes')
                .send({
                    name: 'Bad Owner',
                    owner: 'someone_else',
                    amount: 1000,
                    year_month: 202312
                });

            expect(res.status).toBe(400);
        });

        it('should get all incomes', async () => {
            await request(app).post('/api/incomes').send({ name: 'I1', owner: 'jag', amount: 100, year_month: 202312 });
            await request(app).post('/api/incomes').send({ name: 'I2', owner: 'fruga', amount: 200, year_month: 202312 });

            const res = await request(app).get('/api/incomes?yearMonth=202312');
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });
    });

    describe('Categories API', () => {
        it('should create and list categories', async () => {
            const res = await request(app)
                .post('/api/categories')
                .send({ name: 'Food', color: '#ff0000' });

            expect(res.status).toBe(201);

            const list = await request(app).get('/api/categories');
            expect(list.body).toHaveLength(1);
            expect(list.body[0].name).toBe('Food');
        });
    });

    describe('Expenses API', () => {
        it('should create a variable expense', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .send({
                    name: 'Lunch',
                    amount: 50,
                    expense_type: 'variable',
                    payment_method: 'autogiro_gemensamt',
                    year_month: 202310
                });

            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Lunch');
            expect(res.body.year_month).toBe(202310);
        });
    });
});
