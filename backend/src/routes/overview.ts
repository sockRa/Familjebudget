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

  const incomes = db.getIncomes(yearMonth) as Income[];
  const expenses = db.getExpenses(yearMonth) as Expense[];

  const overview = calculateMonthlyOverview(incomes, expenses, yearMonth);
  res.json(overview);
});

// Get list of months with expenses
router.get('/', (req: Request, res: Response) => {
  const months = db.getExpenseMonths();
  res.json(months);
});

export default router;
