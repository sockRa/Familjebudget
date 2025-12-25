import { describe, it, expect } from 'vitest';
import {
    calculateTotalIncome,
    calculateTotalExpenses,
    calculateExpensesByPaymentMethod,
    calculateTransferToJoint,
    calculateMonthlyOverview,
    calculateExpensesByPerson,
    getExpensesForMonth,
} from './calculations.js';
import type { Income, Expense } from './types.js';

const mockIncomes: Income[] = [
    { id: 1, name: 'Lön', owner: 'jag', amount: 30000, year_month: 202412 },
    { id: 2, name: 'Lön', owner: 'fruga', amount: 25000, year_month: 202412 },
    { id: 3, name: 'Barnbidrag', owner: 'jag', amount: 1250, year_month: 202412 },
];

const mockExpenses: Expense[] = [
    // Fixed expenses
    { id: 1, name: 'Hyra', amount: 12000, category_id: 1, expense_type: 'fixed', payment_method: 'autogiro_gemensamt', payment_status: 'unpaid', year_month: null, overrides_expense_id: null, created_at: '' },
    { id: 2, name: 'El', amount: 800, category_id: 1, expense_type: 'fixed', payment_method: 'autogiro_gemensamt', payment_status: 'unpaid', year_month: null, overrides_expense_id: null, created_at: '' },
    { id: 3, name: 'Spotify', amount: 179, category_id: 4, expense_type: 'fixed', payment_method: 'autogiro_jag', payment_status: 'paid', year_month: null, overrides_expense_id: null, created_at: '' },
    { id: 4, name: 'Netflix', amount: 169, category_id: 4, expense_type: 'fixed', payment_method: 'autogiro_fruga', payment_status: 'paid', year_month: null, overrides_expense_id: null, created_at: '' },
    // Variable expenses for December 2024
    { id: 5, name: 'Julklappar', amount: 3000, category_id: 6, expense_type: 'variable', payment_method: 'efaktura_jag', payment_status: 'pending', year_month: 202412, overrides_expense_id: null, created_at: '' },
    // Variable expenses for January 2025
    { id: 6, name: 'Nyårsfest', amount: 500, category_id: 4, expense_type: 'variable', payment_method: 'autogiro_gemensamt', payment_status: 'unpaid', year_month: 202501, overrides_expense_id: null, created_at: '' },
];

describe('calculateTotalIncome', () => {
    it('should sum all incomes correctly', () => {
        expect(calculateTotalIncome(mockIncomes)).toBe(56250);
    });

    it('should return 0 for empty array', () => {
        expect(calculateTotalIncome([])).toBe(0);
    });
});

describe('calculateTotalExpenses', () => {
    it('should include fixed expenses and variable for the specified month', () => {
        // Fixed: 12000 + 800 + 179 + 169 = 13148
        // Variable Dec 2024: 3000
        // Total: 16148
        expect(calculateTotalExpenses(mockExpenses, 202412)).toBe(16148);
    });

    it('should not include variable expenses from other months', () => {
        // Fixed: 13148, Variable Jan 2025: 500
        expect(calculateTotalExpenses(mockExpenses, 202501)).toBe(13648);
    });
});

describe('calculateExpensesByPaymentMethod', () => {
    it('should group expenses correctly for December 2024', () => {
        const result = calculateExpensesByPaymentMethod(mockExpenses, 202412);
        // Hyra (12000) + El (800) = 12800 on autogiro_gemensamt
        expect(result.autogiro_gemensamt).toBe(12800);
        expect(result.efaktura_jag).toBe(3000); // Julklappar
        expect(result.autogiro_jag).toBe(179);
        expect(result.autogiro_fruga).toBe(169);
    });

    it('should include joint variable expenses for the correct month', () => {
        const result = calculateExpensesByPaymentMethod(mockExpenses, 202501);
        // Hyra (12000) + El (800) + Nyårsfest (500) = 13300 on autogiro_gemensamt
        expect(result.autogiro_gemensamt).toBe(13300);
    });
});

describe('calculateExpensesByPerson', () => {
    it('should group expenses correctly for December 2024 (excluding paid)', () => {
        const result = calculateExpensesByPerson(mockExpenses, 202412);
        // Spotify (id: 3, paid) and Netflix (id: 4, paid) are EXCLUDED
        // Julklappar (id: 5, pending, efaktura_jag) is INCLUDED for jag
        expect(result.jag).toBe(3000);
        expect(result.fruga).toBe(0);
        expect(result.gemensamt).toBe(12800); // 12000 (joint autogiro) + 800 (autogiro_gemensamt)
    });

    it('should include variable joint expenses for the correct month', () => {
        const result = calculateExpensesByPerson(mockExpenses, 202501);
        expect(result.gemensamt).toBe(13300); // 12000 + 800 + 500 (autogiro_gemensamt)
    });
});

describe('calculateTransferToJoint', () => {
    it('should split joint account expenses 50/50 by default', () => {
        const result = calculateTransferToJoint(mockExpenses, 202412);
        // 12000 (joint autogiro) + 800 (autogiro_gemensamt) = 12800
        expect(result.jag).toBe(6400);
        expect(result.fruga).toBe(6400);
    });

    it('should include variable joint expenses for the month', () => {
        const result = calculateTransferToJoint(mockExpenses, 202501);
        // 12000 (joint autogiro) + 800 (autogiro_gemensamt) + 500 (autogiro_gemensamt) = 13300
        expect(result.jag).toBe(6650);
        expect(result.fruga).toBe(6650);
    });

    it('should respect custom split ratio', () => {
        const result = calculateTransferToJoint(mockExpenses, 202412, 0.6);
        // 12800 * 0.6 = 7680
        expect(result.jag).toBe(7680);
        expect(result.fruga).toBe(5120); // 12800 * 0.4
    });
});

describe('calculateMonthlyOverview', () => {
    it('should calculate complete overview correctly', () => {
        const result = calculateMonthlyOverview(mockIncomes, mockExpenses, 202412);

        expect(result.yearMonth).toBe(202412);
        expect(result.totalIncome).toBe(56250);
        expect(result.totalExpenses).toBe(16148);
        expect(result.balance).toBe(40102);
        expect(result.transferToJoint.jag).toBe(6400);
        expect(result.transferToJoint.fruga).toBe(6400);
        expect(result.expensesByPerson.jag).toBe(3000); // Julklappar (efaktura_jag)
        expect(result.expensesByPerson.fruga).toBe(0);
        expect(result.expensesByPerson.gemensamt).toBe(12800);
    });
});

describe('getExpensesForMonth', () => {
    it('should return fixed expenses plus variable for the month', () => {
        const result = getExpensesForMonth(mockExpenses, 202412);
        expect(result).toHaveLength(5); // 4 fixed + 1 variable for Dec
    });

    it('should exclude variable expenses from other months', () => {
        const result = getExpensesForMonth(mockExpenses, 202501);
        expect(result).toHaveLength(5); // 4 fixed + 1 variable for Jan
        expect(result.find(e => e.name === 'Julklappar')).toBeUndefined();
    });
});

describe('Regression: Multi-month Override Filtering', () => {
    it('should exclude fixed expenses that are overrides for other months', () => {
        const expenses: Expense[] = [
            {
                id: 1, name: 'Normal Fixed', amount: 1000,
                category_id: 1,
                expense_type: 'fixed', payment_method: 'autogiro_gemensamt',
                payment_status: 'unpaid', year_month: null, overrides_expense_id: null, created_at: ''
            },
            {
                id: 2, name: 'Override Other Month', amount: 500,
                category_id: 1,
                expense_type: 'fixed', payment_method: 'autogiro_gemensamt',
                payment_status: 'unpaid', year_month: 202412, overrides_expense_id: null, created_at: ''
            }
        ];

        // Should only count id: 1 for month 202501
        expect(calculateTotalExpenses(expenses, 202501)).toBe(1000);

        // Should count both id: 1 and id: 2 for month 202412
        // Wait, if id: 2 is an override for id: 1, then db.getExpenses would only return id: 2.
        // But the calculation function should still be robust.
        expect(calculateTotalExpenses(expenses, 202412)).toBe(1500);
    });
});
