import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

// Get expenses (optionally filtered by month)
router.get('/', (req: Request, res: Response) => {
    const yearMonth = req.query.year_month ? parseInt(req.query.year_month as string) : undefined;
    res.json(db.getExpenses(yearMonth));
});

// Create expense
router.post('/', (req: Request, res: Response) => {
    const { name, amount, category_id, expense_type, payment_method, payment_status, year_month } = req.body;

    if (!name || amount === undefined || !expense_type || !payment_method) {
        return res.status(400).json({ error: 'Name, amount, expense_type, and payment_method are required' });
    }

    const validTypes = ['fixed', 'variable'];
    const validMethods = ['efaktura', 'autogiro_jag', 'autogiro_fruga', 'autogiro_gemensamt'];
    const validStatuses = ['unpaid', 'pending', 'paid'];

    if (!validTypes.includes(expense_type)) {
        return res.status(400).json({ error: 'Invalid expense_type' });
    }
    if (!validMethods.includes(payment_method)) {
        return res.status(400).json({ error: 'Invalid payment_method' });
    }
    if (payment_status && !validStatuses.includes(payment_status)) {
        return res.status(400).json({ error: 'Invalid payment_status' });
    }
    if (expense_type === 'variable' && !year_month) {
        return res.status(400).json({ error: 'year_month is required for variable expenses' });
    }

    const expense = db.createExpense({
        name,
        amount,
        category_id: category_id || null,
        expense_type,
        payment_method,
        payment_status: payment_status || 'unpaid',
        year_month: expense_type === 'fixed' ? null : year_month,
    });

    res.status(201).json(expense);
});

// Update expense
router.put('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, amount, category_id, expense_type, payment_method, payment_status, year_month } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (amount !== undefined) updates.amount = amount;
    if (category_id !== undefined) updates.category_id = category_id;
    if (expense_type !== undefined) updates.expense_type = expense_type;
    if (payment_method !== undefined) updates.payment_method = payment_method;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (year_month !== undefined) updates.year_month = year_month;

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

export default router;
