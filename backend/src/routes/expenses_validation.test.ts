import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../db/sqlite.js';

describe('Security Fix - Expenses API Input Validation', () => {
    beforeEach(() => {
        db.exec('DELETE FROM expenses');
        db.exec("DELETE FROM sqlite_sequence WHERE name = 'expenses'");
    });

    it('should reject invalid year_month with 400', async () => {
        // Create an expense
        await request(app)
            .post('/api/expenses')
            .send({
                name: 'Valid Expense',
                amount: 100,
                expense_type: 'variable',
                payment_method: 'transfer',
                year_month: 202312
            });

        // Request with invalid year_month
        const res = await request(app).get('/api/expenses?year_month=invalid_date');

        // This should fail before the fix
        expect(res.status).toBe(400);
    });

    it('should reject invalid id in PUT with 400', async () => {
         const res = await request(app).put('/api/expenses/invalid_id').send({});
         expect(res.status).toBe(400);
    });

    it('should reject invalid id in DELETE with 400', async () => {
         const res = await request(app).delete('/api/expenses/invalid_id');
         expect(res.status).toBe(400);
    });
});
