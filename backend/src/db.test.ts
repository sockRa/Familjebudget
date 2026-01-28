import { describe, it, expect, beforeEach } from 'vitest';
import {
    getCategories, createCategory, deleteCategory, updateCategory,
    getIncomes, createIncome, deleteIncome, updateIncome,
    getExpenses, createExpense, deleteExpense
} from './db.js';
import db from './db/sqlite.js';

describe('Database operations', () => {
    beforeEach(() => {
        // Clear tables before each test
        db.exec('DELETE FROM expenses');
        db.exec('DELETE FROM incomes');
        db.exec('DELETE FROM categories');
        // Reset autoincrement
        db.exec("DELETE FROM sqlite_sequence WHERE name IN ('expenses', 'incomes', 'categories')");
    });

    describe('Categories', () => {
        it('should create and get categories', () => {
            const cat = createCategory('Test Cat');
            expect(cat.id).toBeTypeOf('number');
            expect(cat.name).toBe('Test Cat');

            const all = getCategories() as any[];
            expect(all).toHaveLength(1);
            expect(all[0].name).toBe('Test Cat');
        });

        it('should update categories', () => {
            const cat = createCategory('Old Name', '#000000');
            const updated = updateCategory(cat.id, { name: 'New Name', color: '#ffffff' });
            expect(updated.name).toBe('New Name');
            expect(updated.color).toBe('#ffffff');

            const fetched = getCategories() as any[];
            expect(fetched[0].name).toBe('New Name');
        });

        it('should delete categories', () => {
            const cat = createCategory('To Delete');
            deleteCategory(Number(cat.id));
            expect(getCategories()).toHaveLength(0);
        });
    });

    describe('Incomes', () => {
        it('should create and get incomes', () => {
            const inc = createIncome('Salary', 'jag', 5000, 202312);
            expect(inc.id).toBeTypeOf('number');
            expect(inc.name).toBe('Salary');
            expect(inc.amount).toBe(5000);
            expect(inc.year_month).toBe(202312);

            const all = getIncomes(202312) as any[];
            expect(all).toHaveLength(1);
            expect(all[0].name).toBe('Salary');
            expect(all[0].amount).toBe(5000);
        });

        it('should update and delete incomes', () => {
            const inc = createIncome('Old', 'fruga', 1000, 202312);
            const updated = updateIncome(inc.id, { amount: 2000 });
            expect(updated.amount).toBe(2000);

            deleteIncome(Number(inc.id));
            expect(getIncomes(202312)).toHaveLength(0);
        });
    });

    describe('Expenses', () => {
        it('should create and get expenses', () => {
            const cat = createCategory('Food');
            const exp = createExpense({
                name: 'Grocery',
                amount: 200,
                category_id: cat.id,
                expense_type: 'variable',
                payment_method: 'autogiro_gemensamt',
                year_month: 202310
            });

            expect((exp as any).name).toBe('Grocery');
            expect((exp as any).category_name).toBe('Food');

            const all = getExpenses(202310) as any[];
            expect(all).toHaveLength(1);
            expect(all[0].name).toBe('Grocery');
        });
    });
});
