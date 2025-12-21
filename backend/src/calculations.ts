import type { Income, Expense, PaymentMethod, MonthlyOverview } from './types.js';

/**
 * Calculate total income
 */
export function calculateTotalIncome(incomes: Income[]): number {
    return incomes.reduce((sum, income) => sum + income.amount, 0);
}

/**
 * Calculate total expenses for a given month
 * Fixed expenses are always included, variable expenses only for the specified month
 */
export function calculateTotalExpenses(expenses: Expense[], yearMonth: number): number {
    return expenses
        .filter(e => e.expense_type === 'fixed' || e.year_month === yearMonth)
        .reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Calculate expenses grouped by payment method
 */
export function calculateExpensesByPaymentMethod(
    expenses: Expense[],
    yearMonth: number
): Record<PaymentMethod, number> {
    const result: Record<PaymentMethod, number> = {
        efaktura: 0,
        efaktura_jag: 0,
        efaktura_fruga: 0,
        efaktura_gemensamt: 0,
        autogiro_jag: 0,
        autogiro_fruga: 0,
        autogiro_gemensamt: 0,
    };

    expenses
        .filter(e => e.expense_type === 'fixed' || e.year_month === yearMonth)
        .forEach(expense => {
            result[expense.payment_method] += expense.amount;
        });

    return result;
}

/**
 * Calculate expenses grouped by person
 */
export function calculateExpensesByPerson(
    expenses: Expense[],
    yearMonth: number
): { jag: number; fruga: number; gemensamt: number } {
    const result = {
        jag: 0,
        fruga: 0,
        gemensamt: 0,
    };

    expenses
        .filter(e => e.expense_type === 'fixed' || e.year_month === yearMonth)
        .filter(e => e.payment_status !== 'paid')
        .forEach(expense => {
            if (expense.payment_method === 'autogiro_jag' || expense.payment_method === 'efaktura_jag') {
                result.jag += expense.amount;
            } else if (expense.payment_method === 'autogiro_fruga' || expense.payment_method === 'efaktura_fruga') {
                result.fruga += expense.amount;
            } else if (expense.payment_method === 'autogiro_gemensamt' || expense.payment_method === 'efaktura_gemensamt') {
                result.gemensamt += expense.amount;
            } else {
                // 'efaktura' (legacy) or other generic methods go to gemensamt
                result.gemensamt += expense.amount;
            }
        });

    return result;
}

/**
 * Calculate how much each person needs to transfer to the joint account
 * Split is 50/50 by default
 */
export function calculateTransferToJoint(
    expenses: Expense[],
    yearMonth: number,
    splitRatio: number = 0.5
): { jag: number; fruga: number } {
    const jointTotal = expenses
        .filter(e => e.expense_type === 'fixed' || e.year_month === yearMonth)
        .filter(e => e.payment_method === 'autogiro_gemensamt' || e.payment_method === 'efaktura_gemensamt' || e.payment_method === 'efaktura')
        .reduce((sum, e) => sum + e.amount, 0);

    return {
        jag: Math.round(jointTotal * splitRatio * 100) / 100,
        fruga: Math.round(jointTotal * (1 - splitRatio) * 100) / 100,
    };
}

/**
 * Calculate complete monthly overview
 */
export function calculateMonthlyOverview(
    incomes: Income[],
    expenses: Expense[],
    yearMonth: number
): MonthlyOverview {
    const totalIncome = calculateTotalIncome(incomes);
    const totalExpenses = calculateTotalExpenses(expenses, yearMonth);
    const expensesByPaymentMethod = calculateExpensesByPaymentMethod(expenses, yearMonth);
    const expensesByPerson = calculateExpensesByPerson(expenses, yearMonth);
    const transferToJoint = calculateTransferToJoint(expenses, yearMonth);

    return {
        yearMonth,
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transferToJoint,
        expensesByPaymentMethod,
        expensesByPerson,
    };
}

/**
 * Get expenses for a specific month (fixed + variable for that month)
 */
export function getExpensesForMonth(expenses: Expense[], yearMonth: number): Expense[] {
    return expenses.filter(e => e.expense_type === 'fixed' || e.year_month === yearMonth);
}
