import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../db/sqlite.js';

describe('Expenses API Validation', () => {
    let expenseId: number;

    beforeEach(async () => {
        db.exec('DELETE FROM expenses');
        db.exec("DELETE FROM sqlite_sequence WHERE name = 'expenses'");

        // Create a test expense
        const res = await request(app)
            .post('/api/expenses')
            .send({
                name: 'Test Expense',
                amount: 100,
                expense_type: 'variable',
                payment_method: 'transfer',
                year_month: 202401
            });
        expenseId = res.body.id;
    });

    describe('PUT /api/expenses/:id', () => {
        it('should update expense with valid numeric ID', async () => {
            const res = await request(app)
                .put(`/api/expenses/${expenseId}`)
                .send({
                    name: 'Updated Name',
                    amount: 200
                });
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('Updated Name');
            expect(res.body.amount).toBe(200);
        });

        it('should fail with invalid non-numeric ID', async () => {
            const res = await request(app)
                .put('/api/expenses/abc')
                .send({
                    name: 'Updated Name'
                });
            expect(res.status).toBe(400); // Validation error
            expect(res.body.error).toBe('Valideringsfel');
        });
    });

    describe('DELETE /api/expenses/:id', () => {
        it('should fail with invalid non-numeric ID', async () => {
            const res = await request(app).delete('/api/expenses/abc');
            expect(res.status).toBe(400);
        });

        it('should delete expense with valid numeric ID', async () => {
            const res = await request(app).delete(`/api/expenses/${expenseId}`);
            expect(res.status).toBe(204);
        });
    });

    describe('POST /api/expenses/:id/override', () => {
        let fixedExpenseId: number;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/expenses')
                .send({
                    name: 'Fixed Expense',
                    amount: 500,
                    expense_type: 'fixed',
                    payment_method: 'transfer'
                });
            fixedExpenseId = res.body.id;
        });

        it('should create override with valid ID', async () => {
            const res = await request(app)
                .post(`/api/expenses/${fixedExpenseId}/override`)
                .send({
                    year_month: 202402,
                    amount: 600
                });
            expect(res.status).toBe(201);
            expect(res.body.amount).toBe(600);
            expect(res.body.overrides_expense_id).toBe(fixedExpenseId);
        });

        it('should fail with invalid ID', async () => {
            const res = await request(app)
                .post('/api/expenses/abc/override')
                .send({
                    year_month: 202402,
                    amount: 600
                });
            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/expenses/:id/hide/:yearMonth', () => {
        let fixedExpenseId: number;

        beforeEach(async () => {
            const res = await request(app)
                .post('/api/expenses')
                .send({
                    name: 'Fixed Expense',
                    amount: 500,
                    expense_type: 'fixed',
                    payment_method: 'transfer'
                });
            fixedExpenseId = res.body.id;
        });

        it('should hide expense with valid ID and yearMonth', async () => {
            const res = await request(app)
                .post(`/api/expenses/${fixedExpenseId}/hide/202402`);

            expect(res.status).toBe(201);
            expect(res.body.is_deleted).toBe(1);
        });

        it('should fail with invalid ID', async () => {
            const res = await request(app)
                .post('/api/expenses/abc/hide/202402');
            expect(res.status).toBe(400);
        });

        it('should fail with invalid yearMonth format', async () => {
            const res = await request(app)
                .post(`/api/expenses/${fixedExpenseId}/hide/2024-02`); // Invalid format (should be YYYYMM)
            expect(res.status).toBe(400);
        });

        it('should fail with non-numeric yearMonth', async () => {
            const res = await request(app)
                .post(`/api/expenses/${fixedExpenseId}/hide/january`);
            expect(res.status).toBe(400);
        });
    });
});
