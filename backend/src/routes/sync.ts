import { Router, Request, Response } from 'express';
import db from '../db.js';
import { calculateMonthlyOverviewPreFiltered } from '../shared/calculations.js';
import { addMonths } from '../shared/types.js';
import { validateParams } from '../middleware/validate.js';
import { YearMonthParamSchema } from '../db/schemas.js';
import type { Income, Expense } from '../types.js';

const router = Router();

router.get('/:yearMonth', validateParams(YearMonthParamSchema), (req: Request, res: Response) => {
    const { yearMonth } = req.params as unknown as { yearMonth: number };
    const prevYearMonth = addMonths(yearMonth, -1);

    // Fetch all data in parallel logic (though SQLite is sync, this structures the intent)
    const incomes = db.getIncomes(yearMonth);
    const expenses = db.getExpenses(yearMonth);

    // Fetch previous month data for overview calculation
    const prevIncomes = db.getIncomesForOverview(prevYearMonth) as Pick<Income, 'amount'>[];
    const prevExpenses = db.getExpensesForOverview(prevYearMonth) as Pick<Expense, 'amount' | 'payment_method' | 'payment_status' | 'is_transfer'>[];

    const previousOverview = calculateMonthlyOverviewPreFiltered(prevIncomes, prevExpenses, prevYearMonth);

    res.json({
        incomes,
        expenses,
        previousOverview
    });
});

export default router;
