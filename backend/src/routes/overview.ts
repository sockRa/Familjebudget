import { Router, Request, Response } from 'express';
import db from '../db.js';
import { calculateMonthlyOverviewPreFiltered } from '../calculations.js';
import type { Income, Expense } from '../types.js';
import { validateParams } from '../middleware/validate.js';
import { YearMonthParamSchema } from '../db/schemas.js';

const router = Router();

// Get monthly overview
router.get('/:yearMonth', validateParams(YearMonthParamSchema), (req: Request, res: Response) => {
  const { yearMonth } = req.params as unknown as { yearMonth: number };

  const incomes = db.getIncomesForOverview(yearMonth) as Pick<Income, 'amount'>[];
  const expenses = db.getExpensesForOverview(yearMonth) as Pick<Expense, 'amount' | 'payment_method' | 'payment_status' | 'is_transfer'>[];

  const overview = calculateMonthlyOverviewPreFiltered(incomes, expenses, yearMonth);
  res.json(overview);
});

// Get list of months with expenses
router.get('/', (req: Request, res: Response) => {
  const months = db.getExpenseMonths();
  res.json(months);
});

export default router;
