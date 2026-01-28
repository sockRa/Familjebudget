import { Router, Request, Response } from 'express';
import db from '../db/sqlite.js';
import type { MonthlyStats, PaymentMethod } from '../types.js';

const router = Router();

// Get monthly statistics
router.get('/monthly', (req: Request, res: Response) => {
    const start = parseInt(req.query.start as string);
    const end = parseInt(req.query.end as string);

    if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ error: 'Start and end must be valid numbers' });
    }

    // Validate range and format (YYYYMM)
    // Security: Prevent loop exhaustion and invalid queries
    if (start < 190001 || start > 209912 || end < 190001 || end > 209912) {
        return res.status(400).json({ error: 'Date range must be between 190001 and 209912' });
    }

    if (start > end) {
        return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Get all months in range
    const months: number[] = [];
    let current = start;
    while (current <= end) {
        months.push(current);
        // Increment month
        const year = Math.floor(current / 100);
        const month = current % 100;
        if (month === 12) {
            current = (year + 1) * 100 + 1;
        } else {
            current = year * 100 + month + 1;
        }
    }

    // 1. Fetch Incomes
    const incomes = db.prepare(`
        SELECT year_month, SUM(amount) as total
        FROM incomes
        WHERE year_month >= ? AND year_month <= ?
        GROUP BY year_month
    `).all(start, end) as { year_month: number; total: number }[];

    const incomeMap = new Map<number, number>();
    incomes.forEach(i => incomeMap.set(i.year_month, i.total));

    // 2. Fetch Categories
    const categories = db.prepare('SELECT id, name FROM categories').all() as { id: number; name: string }[];
    const categoryMap = new Map<number, string>();
    categories.forEach(c => categoryMap.set(c.id, c.name));

    // 3. Fetch Fixed Expenses
    const fixedExpenses = db.prepare(`
        SELECT id, amount, payment_method, category_id
        FROM expenses
        WHERE expense_type = 'fixed' AND year_month IS NULL AND overrides_expense_id IS NULL
    `).all() as { id: number; amount: number; payment_method: string; category_id: number | null }[];

    // 4. Fetch Variable Expenses
    const variableExpenses = db.prepare(`
        SELECT amount, payment_method, category_id, year_month
        FROM expenses
        WHERE expense_type = 'variable' AND year_month >= ? AND year_month <= ? AND overrides_expense_id IS NULL
    `).all(start, end) as { amount: number; payment_method: string; category_id: number | null; year_month: number }[];

    // 5. Fetch Overrides
    const overrides = db.prepare(`
        SELECT amount, payment_method, category_id, year_month, overrides_expense_id, is_deleted
        FROM expenses
        WHERE overrides_expense_id IS NOT NULL AND year_month >= ? AND year_month <= ?
    `).all(start, end) as { amount: number; payment_method: string; category_id: number | null; year_month: number; overrides_expense_id: number; is_deleted: number | null }[];

    // Group Variable Expenses by Month
    const variableByMonth = new Map<number, typeof variableExpenses>();
    variableExpenses.forEach(e => {
        if (!variableByMonth.has(e.year_month)) variableByMonth.set(e.year_month, []);
        variableByMonth.get(e.year_month)!.push(e);
    });

    // Group Overrides by Month
    const overridesByMonth = new Map<number, typeof overrides>();
    overrides.forEach(e => {
        if (!overridesByMonth.has(e.year_month)) overridesByMonth.set(e.year_month, []);
        overridesByMonth.get(e.year_month)!.push(e);
    });

    const stats: MonthlyStats[] = months.map(yearMonth => {
        const totalIncome = incomeMap.get(yearMonth) || 0;

        const monthOverrides = overridesByMonth.get(yearMonth) || [];
        const monthVariable = variableByMonth.get(yearMonth) || [];

        // Set of fixed expense IDs that are overridden
        const overriddenFixedIds = new Set<number>();
        monthOverrides.forEach(o => overriddenFixedIds.add(o.overrides_expense_id));

        let totalExpenses = 0;
        const byCategory: Record<string, number> = {};
        const byPaymentMethod: Record<PaymentMethod, number> = {
            efaktura_jag: 0,
            efaktura_fruga: 0,
            autogiro_jag: 0,
            autogiro_fruga: 0,
            autogiro_gemensamt: 0,
            transfer: 0,
        };

        const addExpense = (amount: number, method: string, categoryId: number | null) => {
            // Update total
            totalExpenses += amount;

            // Update category
            const categoryName = categoryId ? categoryMap.get(categoryId) || null : null;
            const cat = categoryName || 'Okategoriserat';
            byCategory[cat] = (byCategory[cat] || 0) + amount;

            // Update payment method
            const pm = method as PaymentMethod;
            if (byPaymentMethod[pm] !== undefined) {
                byPaymentMethod[pm] += amount;
            }
        };

        // Add Fixed Expenses (if not overridden)
        for (const fixed of fixedExpenses) {
            if (!overriddenFixedIds.has(fixed.id)) {
                addExpense(fixed.amount, fixed.payment_method, fixed.category_id);
            }
        }

        // Add Overrides (if not deleted)
        for (const ov of monthOverrides) {
            if (ov.is_deleted !== 1) { // SQLite stores boolean as 0/1
                addExpense(ov.amount, ov.payment_method, ov.category_id);
            }
        }

        // Add Variable Expenses
        for (const v of monthVariable) {
            addExpense(v.amount, v.payment_method, v.category_id);
        }

        return {
            yearMonth,
            totalExpenses,
            totalIncome,
            byCategory,
            byPaymentMethod,
        };
    });

    res.json(stats);
});

export default router;
