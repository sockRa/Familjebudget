import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../db/sqlite.js';

describe('Statistics API', () => {
    beforeEach(() => {
        db.exec('DELETE FROM expenses');
        db.exec('DELETE FROM incomes');
        db.exec('DELETE FROM categories');
        db.exec("DELETE FROM sqlite_sequence WHERE name IN ('expenses', 'incomes', 'categories')");
    });

    describe('GET /api/statistics/monthly', () => {
        it('should return monthly statistics', async () => {
            // Setup data
            // Category
            const { lastInsertRowid: catId } = db.prepare("INSERT INTO categories (name) VALUES (?)").run('Food');

            // Income
            db.prepare("INSERT INTO incomes (name, owner, amount, year_month) VALUES (?, ?, ?, ?)").run('Salary', 'jag', 30000, 202301);

            // Variable Expense
            db.prepare(`
                INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, year_month)
                VALUES (?, ?, ?, 'variable', 'efaktura_jag', ?)
            `).run('Lunch', 100, catId, 202301);

            // Fixed Expense
            const { lastInsertRowid: fixedId } = db.prepare(`
                INSERT INTO expenses (name, amount, category_id, expense_type, payment_method)
                VALUES (?, ?, ?, 'fixed', 'autogiro_gemensamt')
            `).run('Rent', 5000, catId);

            // Override (for 202302)
             db.prepare(`
                INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, year_month, overrides_expense_id)
                VALUES (?, ?, ?, 'fixed', 'autogiro_gemensamt', ?, ?)
            `).run('Rent Adjusted', 5500, catId, 202302, fixedId);

            const res = await request(app).get('/api/statistics/monthly?start=202301&end=202302');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2); // 202301, 202302

            // Check Jan 2023
            const jan = res.body.find((s: any) => s.yearMonth === 202301);
            expect(jan).toBeDefined();
            expect(jan.totalIncome).toBe(30000);
            // Expenses: 100 (var) + 5000 (fixed) = 5100
            expect(jan.totalExpenses).toBe(5100);
            expect(jan.byCategory['Food']).toBe(5100);

            // Check Feb 2023
            const feb = res.body.find((s: any) => s.yearMonth === 202302);
            expect(feb).toBeDefined();
            expect(feb.totalIncome).toBe(0); // No income in Feb
            // Expenses: 5500 (override)
            expect(feb.totalExpenses).toBe(5500);
        });

        it('should validate start and end parameters', async () => {
            // Invalid format (too small)
            let res = await request(app).get('/api/statistics/monthly?start=189912&end=202301');
            expect(res.status).toBe(400);

            // Invalid format (too large)
            res = await request(app).get('/api/statistics/monthly?start=202301&end=210001');
            expect(res.status).toBe(400);

            // Invalid range (start > end)
            res = await request(app).get('/api/statistics/monthly?start=202302&end=202301');
            expect(res.status).toBe(400);

            // Non-numeric
            res = await request(app).get('/api/statistics/monthly?start=abc&end=def');
            expect(res.status).toBe(400);
        });
    });
});
