import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { securityHeaders } from './middleware/security.js';
import { rateLimits } from './middleware/rateLimit.js';
import categoriesRouter from './routes/categories.js';
import incomesRouter from './routes/incomes.js';
import expensesRouter from './routes/expenses.js';
import overviewRouter from './routes/overview.js';
import settingsRouter from './routes/settings.js';
import statisticsRouter from './routes/statistics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(securityHeaders);
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173']
}));
app.use(rateLimits.standard);
app.use(express.json());

// API Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/overview', overviewRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/statistics', statisticsRouter);

// Health check
app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
const frontendPath = join(__dirname, '..', 'public');
if (existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req: express.Request, res: express.Response) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(join(frontendPath, 'index.html'));
        }
    });
}

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 Budget API running on http://localhost:${PORT}`);
    });
}

export default app;
