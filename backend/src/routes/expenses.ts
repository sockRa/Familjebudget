import { Router, Request, Response } from 'express';
import db from '../db.js';
import { validate } from '../middleware/validate.js';
import { ExpenseSchema, ExpenseUpdateSchema } from '../db/schemas.js';

const router = Router();

// Get expenses (optionally filtered by month)
router.get('/', (req: Request, res: Response) => {
    const yearMonth = req.query.year_month ? parseInt(req.query.year_month as string) : undefined;
    res.json(db.getExpenses(yearMonth));
});

// Create expense
router.post('/', validate(ExpenseSchema), (req: Request, res: Response) => {
    const expenseData = req.body;

    if (expenseData.expense_type === 'variable' && !expenseData.year_month) {
        return res.status(400).json({ error: 'year_month is required for variable expenses' });
    }

    const expense = db.createExpense(expenseData);
    res.status(201).json(expense);
});

// Update expense
router.put('/:id', validate(ExpenseUpdateSchema), (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const expense = db.updateExpense(id, updates);
    if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
});

// Delete expense
router.delete('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (!db.deleteExpense(id)) {
        return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(204).send();
});

// Create override for a fixed expense (monthly copy)
router.post('/:id/override', validate(ExpenseUpdateSchema), (req: Request, res: Response) => {
    const originalId = parseInt(req.params.id);
    const { year_month, ...overrideData } = req.body;

    if (!year_month) {
        return res.status(400).json({ error: 'year_month is required for override' });
    }

    try {
        const override = db.createExpenseOverride(originalId, year_month, overrideData);
        res.status(201).json(override);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
