import { describe, it, expect, beforeEach } from 'vitest';
import { createExpense, createExpenseOverride, getExpenses } from './db.js';
import db from './db/sqlite.js';

describe('Regression: Overview Override Calculation', () => {
    beforeEach(() => {
        db.exec('DELETE FROM expenses');
        db.exec("DELETE FROM sqlite_sequence WHERE name = 'expenses'");
    });

    it('should NOT double-count an expense when it has an override for the month', () => {
        const yearMonth = 202412;

        // 1. Create a fixed expense
        const original = createExpense({
            name: 'Hyra',
            amount: 10000,
            expense_type: 'fixed',
            payment_method: 'autogiro_gemensamt',
            payment_status: 'unpaid'
        }) as any;

        // 2. Create an override for that month
        createExpenseOverride(original.id, yearMonth, {
            amount: 12000,
            payment_status: 'pending'
        });

        // 3. Get expenses for that month using the DB layer (which is what the overview uses now)
        const expenses = getExpenses(yearMonth) as any[];

        // 4. Verify ONLY the override is present (original is filtered out by db.getExpenses)
        expect(expenses).toHaveLength(1);
        expect(expenses[0].amount).toBe(12000);
        expect(expenses[0].overrides_expense_id).toBe(original.id);
    });
});
