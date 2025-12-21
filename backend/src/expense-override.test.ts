import { describe, it, expect, beforeEach } from 'vitest';
import {
    getExpenses, createExpense, deleteExpense, createExpenseOverride, getExpenseById
} from './db.js';
import db from './db/sqlite.js';

interface Expense {
    id: number;
    name: string;
    amount: number;
    expense_type: string;
    year_month: number | null;
    overrides_expense_id: number | null;
    payment_method: string;
}

describe('Expense Override System', () => {
    beforeEach(() => {
        // Clear expenses before each test
        db.exec('DELETE FROM expenses');
        db.exec("DELETE FROM sqlite_sequence WHERE name = 'expenses'");
    });

    describe('Creating fixed expenses', () => {
        it('should create a fixed expense with no year_month', () => {
            const expense = createExpense({
                name: 'Hyra',
                amount: 10000,
                expense_type: 'fixed',
                payment_method: 'autogiro_gemensamt'
            }) as Expense;

            expect(expense.name).toBe('Hyra');
            expect(expense.expense_type).toBe('fixed');
            expect(expense.year_month).toBeNull();
            expect(expense.overrides_expense_id).toBeNull();
        });
    });

    describe('Filtering expenses by month', () => {
        it('should show fixed expenses for any month', () => {
            createExpense({
                name: 'Hyra',
                amount: 10000,
                expense_type: 'fixed',
                payment_method: 'efaktura'
            });

            const jan = getExpenses(202601) as any[];
            const feb = getExpenses(202602) as any[];

            expect(jan).toHaveLength(1);
            expect(feb).toHaveLength(1);
            expect(jan[0].name).toBe('Hyra');
            expect(feb[0].name).toBe('Hyra');
        });

        it('should only show variable expenses for their specific month', () => {
            createExpense({
                name: 'Julklappar',
                amount: 5000,
                expense_type: 'variable',
                payment_method: 'efaktura',
                year_month: 202612
            });

            const dec = getExpenses(202612) as any[];
            const jan = getExpenses(202701) as any[];

            expect(dec).toHaveLength(1);
            expect(dec[0].name).toBe('Julklappar');
            expect(jan).toHaveLength(0);
        });
    });

    describe('Override system', () => {
        it('should create an override that replaces original for that month', () => {
            // Create fixed expense
            const original = createExpense({
                name: 'Hyra',
                amount: 10000,
                expense_type: 'fixed',
                payment_method: 'autogiro_gemensamt'
            }) as Expense;

            // Create override for feb with new amount
            createExpenseOverride(original.id, 202602, {
                name: 'Hyra',
                amount: 10500,
                payment_method: 'autogiro_gemensamt',
                payment_status: 'unpaid'
            });

            // Check jan - should have original
            const jan = getExpenses(202601) as any[];
            expect(jan).toHaveLength(1);
            expect(jan[0].amount).toBe(10000);
            expect(jan[0].overrides_expense_id).toBeNull();

            // Check feb - should have override, not original
            const feb = getExpenses(202602) as any[];
            expect(feb).toHaveLength(1);
            expect(feb[0].amount).toBe(10500);
            expect(feb[0].overrides_expense_id).toBe(original.id);
        });

        it('should keep override as fixed expense type', () => {
            const original = createExpense({
                name: 'Netflix',
                amount: 179,
                expense_type: 'fixed',
                payment_method: 'efaktura'
            }) as Expense;

            const override = createExpenseOverride(original.id, 202603, {
                name: 'Netflix',
                amount: 199,
                payment_method: 'efaktura'
            });

            expect((override as any).expense_type).toBe('fixed');
            expect((override as any).overrides_expense_id).toBe(original.id);
        });

        it('should update existing override when editing same month twice', () => {
            const original = createExpense({
                name: 'Spotify',
                amount: 129,
                expense_type: 'fixed',
                payment_method: 'autogiro_jag'
            }) as Expense;

            // First override
            createExpenseOverride(original.id, 202604, {
                name: 'Spotify',
                amount: 149,
                payment_method: 'autogiro_jag'
            });

            // Second override for same month - should update, not create new
            createExpenseOverride(original.id, 202604, {
                name: 'Spotify',
                amount: 159,
                payment_method: 'autogiro_jag'
            });

            const apr = getExpenses(202604) as any[];
            expect(apr).toHaveLength(1);
            expect(apr[0].amount).toBe(159);
        });

        it('should not affect other months when creating override', () => {
            const original = createExpense({
                name: 'El',
                amount: 500,
                expense_type: 'fixed',
                payment_method: 'efaktura'
            }) as Expense;

            createExpenseOverride(original.id, 202605, {
                name: 'El',
                amount: 800,
                payment_method: 'efaktura'
            });

            // Check multiple months
            const jan = (getExpenses(202601) as any[])[0];
            const feb = (getExpenses(202602) as any[])[0];
            const may = (getExpenses(202605) as any[])[0];

            expect(jan.amount).toBe(500);
            expect(feb.amount).toBe(500);
            expect(may.amount).toBe(800);
        });
    });
});
