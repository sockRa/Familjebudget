import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

// Get all categories
router.get('/', (req: Request, res: Response) => {
    res.json(db.getCategories());
});

// Create category
router.post('/', (req: Request, res: Response) => {
    const { name, color } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    // Check for duplicate
    const existing = db.getCategories().find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        return res.status(400).json({ error: 'Category already exists' });
    }

    const category = db.createCategory(name, color || '#6366f1');
    res.status(201).json(category);
});

// Update category
router.put('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, color } = req.body;

    const category = db.updateCategory(id, { name, color });
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
