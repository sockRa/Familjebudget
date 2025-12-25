import { Router, Request, Response } from 'express';
import db from '../db/sqlite.js';
import type { MonthlyStats, PaymentMethod } from '../types.js';

const router = Router();

// Get monthly statistics
router.get('/monthly', (req: Request, res: Response) => {
    const start = parseInt(req.query.start as string);
    const end = parseInt(req.query.end as string);

    if (isNaN(start) || isNaN(end) || start > end) {
        return res.status(400).json({ error: 'Invalid start/end parameters' });
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

    const stats: MonthlyStats[] = months.map(yearMonth => {
        // Get incomes for this month
        const incomes = db.prepare(`
            SELECT SUM(amount) as total FROM incomes WHERE year_month = ?
        `).get(yearMonth) as { total: number | null };

        // Get expenses for this month
        // Fixed expenses (no year_month) + variable expenses (year_month = current)
        // Also include overrides for this month, exclude deleted overrides
        const expenseRows = db.prepare(`
            SELECT e.amount, e.payment_method, c.name as category_name
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE 
                -- Fixed expenses without an override for this month
                (e.expense_type = 'fixed' AND e.overrides_expense_id IS NULL AND e.year_month IS NULL
                 AND e.id NOT IN (SELECT overrides_expense_id FROM expenses WHERE year_month = ? AND overrides_expense_id IS NOT NULL))
                -- Variable expenses for this month
                OR (e.expense_type = 'variable' AND e.year_month = ? AND e.overrides_expense_id IS NULL)
                -- Overrides for this month (not deleted)
                OR (e.overrides_expense_id IS NOT NULL AND e.year_month = ? AND (e.is_deleted IS NULL OR e.is_deleted = 0))
        `).all(yearMonth, yearMonth, yearMonth) as Array<{
            amount: number;
            payment_method: string;
            category_name: string | null;
        }>;

        // Calculate totals
        const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);

        // Group by category
        const byCategory: Record<string, number> = {};
        expenseRows.forEach(e => {
            const cat = e.category_name || 'Okategoriserat';
            byCategory[cat] = (byCategory[cat] || 0) + e.amount;
        });

        // Group by payment method
        const byPaymentMethod: Record<PaymentMethod, number> = {
            efaktura_jag: 0,
            efaktura_fruga: 0,
            autogiro_jag: 0,
            autogiro_fruga: 0,
            autogiro_gemensamt: 0,
            transfer: 0,
        };
        expenseRows.forEach(e => {
            const method = e.payment_method as PaymentMethod;
            if (byPaymentMethod[method] !== undefined) {
                byPaymentMethod[method] += e.amount;
            }
        });

        return {
            yearMonth,
            totalExpenses,
            totalIncome: incomes.total || 0,
            byCategory,
            byPaymentMethod,
        };
    });

    res.json(stats);
});

export default router;
