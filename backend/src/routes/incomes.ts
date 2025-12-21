import { Router, Request, Response } from 'express';
import db from '../db.js';
import { validate } from '../middleware/validate.js';
import { IncomeSchema } from '../db/schemas.js';

const router = Router();

// Get all incomes (optionally filtered by month)
router.get('/', (req: Request, res: Response) => {
    const yearMonth = req.query.yearMonth ? parseInt(req.query.yearMonth as string) : undefined;
    res.json(db.getIncomes(yearMonth));
});

// Create income
router.post('/', validate(IncomeSchema), (req: Request, res: Response) => {
    const { name, owner, amount, year_month } = req.body;

    if (!['jag', 'fruga'].includes(owner)) {
        return res.status(400).json({ error: 'Owner must be "jag" or "fruga"' });
    }

    const income = db.createIncome(name, owner, amount, year_month);
    res.status(201).json(income);
});

// Update income
router.put('/:id', validate(IncomeSchema.partial()), (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const income = db.updateIncome(id, updates);
    if (!income) {
        return res.status(404).json({ error: 'Income not found' });
    }
    res.json(income);
});

// Delete income
router.delete('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (!db.deleteIncome(id)) {
        return res.status(404).json({ error: 'Income not found' });
    }
    res.status(204).send();
});

export default router;
