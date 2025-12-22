import { Router, Request, Response } from 'express';
import db from '../db/sqlite.js';
import { validate } from '../middleware/validate.js';
import { SettingsSchema } from '../db/schemas.js';
import type { Settings } from '../types.js';

const router = Router();

// Get all settings
router.get('/', (req: Request, res: Response) => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    res.json(settings);
});

// Update settings
router.put('/', validate(SettingsSchema), (req: Request, res: Response) => {
    const updates = req.body as Partial<Settings>;

    const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    db.transaction(() => {
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                updateStmt.run(key, value);
            }
        }
    })();

    // Return updated settings
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    res.json(settings);
});

export default router;
