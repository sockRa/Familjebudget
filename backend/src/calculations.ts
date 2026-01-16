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
 * Transfers are NOT included in total expenses as they don't reduce overall balance
 */
export function calculateTotalExpenses(expenses: Expense[], yearMonth: number): number {
    return expenses
        .filter(e => (e.expense_type === 'fixed' && e.year_month === null) || e.year_month === yearMonth)
        .filter(e => !e.is_transfer)
        .reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Calculate total transfers for a given month
 */
export function calculateTotalTransfers(expenses: Expense[], yearMonth: number): number {
    return expenses
        .filter(e => (e.expense_type === 'fixed' && e.year_month === null) || e.year_month === yearMonth)
        .filter(e => e.is_transfer)
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
        efaktura_jag: 0,
        efaktura_fruga: 0,
        autogiro_jag: 0,
        autogiro_fruga: 0,
        autogiro_gemensamt: 0,
        transfer: 0,
    };

    expenses
        .filter(e => (e.expense_type === 'fixed' && e.year_month === null) || e.year_month === yearMonth)
        .forEach(expense => {
            result[expense.payment_method] += expense.amount;
        });

    return result;
}

/**
 * Calculate expenses grouped by person (excluding already paid and excluding transfers for "To Pay" list)
 * For autogiro_gemensamt, 'pending' also counts as handled (money is in joint account)
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
        .filter(e => (e.expense_type === 'fixed' && e.year_month === null) || e.year_month === yearMonth)
        .filter(e => !e.is_transfer)
        .forEach(expense => {
            // For autogiro_gemensamt, pending means money is already in joint account
            const isHandled = expense.payment_status === 'paid' ||
                (expense.payment_method === 'autogiro_gemensamt' && expense.payment_status === 'pending');

            if (isHandled) return;

            if (expense.payment_method === 'autogiro_jag' || expense.payment_method === 'efaktura_jag') {
                result.jag += expense.amount;
            } else if (expense.payment_method === 'autogiro_fruga' || expense.payment_method === 'efaktura_fruga') {
                result.fruga += expense.amount;
            } else if (expense.payment_method === 'autogiro_gemensamt') {
                result.gemensamt += expense.amount;
            } else {
                result.gemensamt += expense.amount;
            }
        });

    return result;
}

/**
 * Calculate liquidity needed by person (Bills + Transfers that still need to be paid)
 * For autogiro_gemensamt, 'pending' also counts as handled (money is in joint account)
 */
export function calculateLiquidityByPerson(
    expenses: Expense[],
    yearMonth: number
): { jag: number; fruga: number; gemensamt: number } {
    const result = {
        jag: 0,
        fruga: 0,
        gemensamt: 0,
    };

    expenses
        .filter(e => (e.expense_type === 'fixed' && e.year_month === null) || e.year_month === yearMonth)
        .forEach(expense => {
            // For autogiro_gemensamt, pending means money is already in joint account
            const isHandled = expense.payment_status === 'paid' ||
                (expense.payment_method === 'autogiro_gemensamt' && expense.payment_status === 'pending');

            if (isHandled) return;

            if (expense.payment_method === 'autogiro_jag' || expense.payment_method === 'efaktura_jag') {
                result.jag += expense.amount;
            } else if (expense.payment_method === 'autogiro_fruga' || expense.payment_method === 'efaktura_fruga') {
                result.fruga += expense.amount;
            } else if (expense.payment_method === 'autogiro_gemensamt') {
                result.gemensamt += expense.amount;
            } else {
                result.gemensamt += expense.amount;
            }
        });

    return result;
}

/**
 * Calculate how much each person needs to transfer to the joint account
 * Excludes paid expenses and pending autogiro_gemensamt (money already in joint account)
 */
export function calculateTransferToJoint(
    expenses: Expense[],
    yearMonth: number,
    splitRatio: number = 0.5
): { jag: number; fruga: number } {
    const jointTotal = expenses
        .filter(e => (e.expense_type === 'fixed' && e.year_month === null) || e.year_month === yearMonth)
        .filter(e => !e.is_transfer)
        .filter(e => e.payment_method === 'autogiro_gemensamt')
        // For autogiro_gemensamt, pending means money is already transferred to joint account
        .filter(e => e.payment_status !== 'paid' && e.payment_status !== 'pending')
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
    const totalTransfers = calculateTotalTransfers(expenses, yearMonth);
    const expensesByPaymentMethod = calculateExpensesByPaymentMethod(expenses, yearMonth);
    const expensesByPerson = calculateExpensesByPerson(expenses, yearMonth);
    const liquidityByPerson = calculateLiquidityByPerson(expenses, yearMonth);
    const transferToJoint = calculateTransferToJoint(expenses, yearMonth);

    return {
        yearMonth,
        totalIncome,
        totalExpenses,
        totalTransfers,
        balance: totalIncome - totalExpenses,
        unbudgeted: totalIncome - totalExpenses - totalTransfers,
        transferToJoint,
        expensesByPaymentMethod,
        expensesByPerson,
        liquidityByPerson,
    };
}

/**
 * Get expenses for a specific month (fixed + variable for that month)
 */
export function getExpensesForMonth(expenses: Expense[], yearMonth: number): Expense[] {
    return expenses.filter(e => (e.expense_type === 'fixed' && e.year_month === null) || e.year_month === yearMonth);
}
