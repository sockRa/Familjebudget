import type { Income, Expense, PaymentMethod, MonthlyOverview } from './types.js';

/**
 * Get expenses for a specific month (fixed + variable for that month)
 */
export function getExpensesForMonth(expenses: Expense[], yearMonth: number): Expense[] {
    return expenses.filter(e => (e.expense_type === 'fixed' && e.year_month === null) || e.year_month === yearMonth);
}

/**
 * Calculate total income
 */
export function calculateTotalIncome(incomes: Income[]): number {
    return incomes.reduce((sum, income) => sum + income.amount, 0);
}

// Deprecated: Internal use only, kept for backward compatibility if needed, but not used in optimized main function
export function _calculateTotalExpenses(filteredExpenses: Expense[]): number {
    return filteredExpenses
        .filter(e => !e.is_transfer)
        .reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Calculate total expenses for a given month
 */
export function calculateTotalExpenses(expenses: Expense[], yearMonth: number): number {
    return _calculateTotalExpenses(getExpensesForMonth(expenses, yearMonth));
}

// Deprecated
export function _calculateTotalTransfers(filteredExpenses: Expense[]): number {
    return filteredExpenses
        .filter(e => e.is_transfer)
        .reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Calculate total transfers for a given month
 */
export function calculateTotalTransfers(expenses: Expense[], yearMonth: number): number {
    return _calculateTotalTransfers(getExpensesForMonth(expenses, yearMonth));
}

// Deprecated
export function _calculateExpensesByPaymentMethod(filteredExpenses: Expense[]): Record<PaymentMethod, number> {
    const result: Record<PaymentMethod, number> = {
        efaktura_jag: 0,
        efaktura_fruga: 0,
        autogiro_jag: 0,
        autogiro_fruga: 0,
        autogiro_gemensamt: 0,
        transfer: 0,
    };

    filteredExpenses
        .forEach(expense => {
            result[expense.payment_method] += expense.amount;
        });

    return result;
}

/**
 * Calculate expenses grouped by payment method
 */
export function calculateExpensesByPaymentMethod(
    expenses: Expense[],
    yearMonth: number
): Record<PaymentMethod, number> {
    return _calculateExpensesByPaymentMethod(getExpensesForMonth(expenses, yearMonth));
}

// Deprecated
export function _calculateExpensesByPerson(filteredExpenses: Expense[]): { jag: number; fruga: number; gemensamt: number } {
    const result = {
        jag: 0,
        fruga: 0,
        gemensamt: 0,
    };

    filteredExpenses
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
 * Calculate expenses grouped by person
 */
export function calculateExpensesByPerson(
    expenses: Expense[],
    yearMonth: number
): { jag: number; fruga: number; gemensamt: number } {
    return _calculateExpensesByPerson(getExpensesForMonth(expenses, yearMonth));
}

// Deprecated
export function _calculateLiquidityByPerson(filteredExpenses: Expense[]): { jag: number; fruga: number; gemensamt: number } {
    const result = {
        jag: 0,
        fruga: 0,
        gemensamt: 0,
    };

    filteredExpenses
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
 * Calculate liquidity needed by person
 */
export function calculateLiquidityByPerson(
    expenses: Expense[],
    yearMonth: number
): { jag: number; fruga: number; gemensamt: number } {
    return _calculateLiquidityByPerson(getExpensesForMonth(expenses, yearMonth));
}

// Deprecated
export function _calculateTransferToJoint(filteredExpenses: Expense[], splitRatio: number = 0.5): { jag: number; fruga: number } {
    const jointTotal = filteredExpenses
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
 * Calculate how much each person needs to transfer to the joint account
 */
export function calculateTransferToJoint(
    expenses: Expense[],
    yearMonth: number,
    splitRatio: number = 0.5
): { jag: number; fruga: number } {
    return _calculateTransferToJoint(getExpensesForMonth(expenses, yearMonth), splitRatio);
}

/**
 * Calculate complete monthly overview
 * Optimized to iterate expenses only once
 */
export function calculateMonthlyOverview(
    incomes: Income[],
    expenses: Expense[],
    yearMonth: number,
    isPreFiltered: boolean = false
): MonthlyOverview {
    // Optimization: Skip filtering if the caller guarantees expenses are already for this month
    const relevantExpenses = isPreFiltered ? expenses : getExpensesForMonth(expenses, yearMonth);

    const totalIncome = calculateTotalIncome(incomes);

    // Initial values
    let totalExpenses = 0;
    let totalTransfers = 0;
    let jointTotalForTransfer = 0;

    const expensesByPaymentMethod: Record<PaymentMethod, number> = {
        efaktura_jag: 0,
        efaktura_fruga: 0,
        autogiro_jag: 0,
        autogiro_fruga: 0,
        autogiro_gemensamt: 0,
        transfer: 0,
    };

    const expensesByPerson = {
        jag: 0,
        fruga: 0,
        gemensamt: 0,
    };

    const liquidityByPerson = {
        jag: 0,
        fruga: 0,
        gemensamt: 0,
    };

    // Single pass loop
    for (const expense of relevantExpenses) {
        const amount = expense.amount;
        const isTransfer = !!expense.is_transfer;
        const method = expense.payment_method;
        const status = expense.payment_status;

        // 1. Expenses by Payment Method
        expensesByPaymentMethod[method] += amount;

        // 2. Total Expenses & Total Transfers
        if (isTransfer) {
            totalTransfers += amount;
        } else {
            totalExpenses += amount;

            // 3. Transfer to Joint Calculation Logic
            // filter: !is_transfer (already inside else), method == autogiro_gemensamt, status != paid/pending
            if (method === 'autogiro_gemensamt' && status !== 'paid' && status !== 'pending') {
                jointTotalForTransfer += amount;
            }
        }

        // 4. Expenses By Person & Liquidity By Person
        // Shared logic for "isHandled"
        // For autogiro_gemensamt, pending means money is already in joint account
        const isHandled = status === 'paid' ||
            (method === 'autogiro_gemensamt' && status === 'pending');

        if (!isHandled) {
            // Determine attribution
            let targetPerson: 'jag' | 'fruga' | 'gemensamt' = 'gemensamt';
            if (method === 'autogiro_jag' || method === 'efaktura_jag') {
                targetPerson = 'jag';
            } else if (method === 'autogiro_fruga' || method === 'efaktura_fruga') {
                targetPerson = 'fruga';
            }

            // Apply to liquidity (includes transfers)
            liquidityByPerson[targetPerson] += amount;

            // Apply to expensesByPerson (excludes transfers)
            if (!isTransfer) {
                expensesByPerson[targetPerson] += amount;
            }
        }
    }

    // Finalize Transfer to Joint
    const splitRatio = 0.5;
    const transferToJoint = {
        jag: Math.round(jointTotalForTransfer * splitRatio * 100) / 100,
        fruga: Math.round(jointTotalForTransfer * (1 - splitRatio) * 100) / 100,
    };

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
