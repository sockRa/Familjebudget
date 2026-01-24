import { Router, Request, Response } from 'express';
import db from '../db.js';
import { validate, validateParams } from '../middleware/validate.js';
import { ExpenseSchema, ExpenseUpdateSchema, IdParamSchema, HideExpenseParamsSchema } from '../db/schemas.js';

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
router.put('/:id', validateParams(IdParamSchema), validate(ExpenseUpdateSchema), (req: Request, res: Response) => {
    const id = (req.params as any).id;
    const updates = req.body;

    const expense = db.updateExpense(id, updates);
    if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
});

// Delete expense
router.delete('/:id', validateParams(IdParamSchema), (req: Request, res: Response) => {
    const id = (req.params as any).id;
    if (!db.deleteExpense(id)) {
        return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(204).send();
});

// Create override for a fixed expense (monthly copy)
router.post('/:id/override', validateParams(IdParamSchema), validate(ExpenseUpdateSchema), (req: Request, res: Response) => {
    const originalId = (req.params as any).id;
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

// Hide a fixed expense for a specific month (soft delete)
router.post('/:id/hide/:yearMonth', validateParams(HideExpenseParamsSchema), (req: Request, res: Response) => {
    const originalId = (req.params as any).id;
    const yearMonth = (req.params as any).yearMonth;

    try {
        const deleted = db.createDeletedOverride(originalId, yearMonth);
        res.status(201).json(deleted);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
