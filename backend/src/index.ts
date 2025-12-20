import express from 'express';
import cors from 'cors';
import categoriesRouter from './routes/categories.js';
import incomesRouter from './routes/incomes.js';
import expensesRouter from './routes/expenses.js';
import overviewRouter from './routes/overview.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/overview', overviewRouter);

// Health check
app.get('/api/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Budget API running on http://localhost:${PORT}`);
});

export default app;
