import { Router, Request, Response } from 'express';
import db from '../db.js';
import { calculateMonthlyOverview } from '../calculations.js';
import type { Income, Expense } from '../types.js';

const router = Router();

// Get monthly overview
router.get('/:yearMonth', (req: Request, res: Response) => {
  const yearMonth = parseInt(req.params.yearMonth);

  if (isNaN(yearMonth) || yearMonth < 190001 || yearMonth > 209912) {
    return res.status(400).json({ error: 'Invalid yearMonth format. Use YYYYMM.' });
  }

  const incomes = db.getAllIncomes() as Income[];
  const allExpenses = db.getAllExpenses();

  // Filter expenses for the month
  const expenses = allExpenses.filter((e: any) =>
    e.expense_type === 'fixed' || e.year_month === yearMonth
  ) as Expense[];

  const overview = calculateMonthlyOverview(incomes, expenses, yearMonth);
  res.json(overview);
});

// Get list of months with expenses
router.get('/', (req: Request, res: Response) => {
  const expenses = db.getAllExpenses();
  const months = [...new Set(
    expenses
      .filter((e: any) => e.year_month !== null)
      .map((e: any) => e.year_month as number)
  )].sort((a, b) => (b ?? 0) - (a ?? 0));

  res.json(months);
});

export default router;
