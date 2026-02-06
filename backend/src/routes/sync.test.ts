import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../db/sqlite.js';

describe('Sync API', () => {
    beforeEach(() => {
        db.exec('DELETE FROM expenses');
        db.exec('DELETE FROM incomes');
        db.exec('DELETE FROM categories');
        db.exec("DELETE FROM sqlite_sequence WHERE name IN ('expenses', 'incomes', 'categories')");
    });

    it('should return incomes, expenses and previous overview', async () => {
        // Seed data
        // Current month: 202401
        await request(app).post('/api/incomes').send({
            name: 'Salary Jan', owner: 'jag', amount: 30000, year_month: 202401
        });
        await request(app).post('/api/expenses').send({
            name: 'Rent Jan', amount: 10000, expense_type: 'variable', payment_method: 'autogiro_gemensamt', year_month: 202401
        });

        // Previous month: 202312
        await request(app).post('/api/incomes').send({
            name: 'Salary Dec', owner: 'jag', amount: 25000, year_month: 202312
        });
        await request(app).post('/api/expenses').send({
            name: 'Rent Dec', amount: 9000, expense_type: 'variable', payment_method: 'autogiro_gemensamt', year_month: 202312
        });

        const res = await request(app).get('/api/sync/202401');

        expect(res.status).toBe(200);

        // Check Incomes (Current Month)
        expect(res.body.incomes).toHaveLength(1);
        expect(res.body.incomes[0].name).toBe('Salary Jan');

        // Check Expenses (Current Month)
        expect(res.body.expenses).toHaveLength(1);
        expect(res.body.expenses[0].name).toBe('Rent Jan');

        // Check Previous Overview
        expect(res.body.previousOverview).toBeDefined();
        expect(res.body.previousOverview.yearMonth).toBe(202312);
        expect(res.body.previousOverview.totalIncome).toBe(25000);
        expect(res.body.previousOverview.totalExpenses).toBe(9000);
    });

    it('should fail with invalid yearMonth', async () => {
        const res = await request(app).get('/api/sync/invalid');
        expect(res.status).toBe(400);
    });
});
