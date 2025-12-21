import { Router, Request, Response } from 'express';
import db from '../db.js';
import { validate } from '../middleware/validate.js';
import { CategorySchema } from '../db/schemas.js';

const router = Router();

// Get all categories
router.get('/', (req: Request, res: Response) => {
    res.json(db.getCategories());
});

// Create category
router.post('/', validate(CategorySchema), (req: Request, res: Response) => {
    const { name } = req.body;

    // Check for duplicate
    const existing = db.getCategories().find((c: any) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        return res.status(400).json({ error: 'Category already exists' });
    }

    const category = db.createCategory(name);
    res.status(201).json(category);
});

// Update category
router.put('/:id', validate(CategorySchema.partial()), (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const category = db.updateCategory(id, updates);
    if (!category) {
        return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
});

// Delete category
router.delete('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (!db.deleteCategory(id)) {
        return res.status(404).json({ error: 'Category not found' });
    }
    res.status(204).send();
});

export default router;
