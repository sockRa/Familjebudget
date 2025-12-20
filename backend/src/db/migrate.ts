import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../data');
const JSON_DB_FILE = join(DATA_DIR, 'budget.json');

async function migrate() {
    if (!existsSync(JSON_DB_FILE)) {
        console.log('No JSON database found, skipping migration.');
        return;
    }

    console.log('Migrating data from JSON to SQLite...');
    const data = JSON.parse(readFileSync(JSON_DB_FILE, 'utf-8'));

    // Migrate Categories
    const insertCategory = db.prepare('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)');
    const migrateCategories = db.transaction((categories) => {
        for (const cat of categories) {
            insertCategory.run(cat.id, cat.name, cat.color);
        }
    });

    // Migrate Incomes
    const insertIncome = db.prepare('INSERT INTO incomes (id, name, owner, amount) VALUES (?, ?, ?, ?)');
    const migrateIncomes = db.transaction((incomes) => {
        for (const inc of incomes) {
            insertIncome.run(inc.id, inc.name, inc.owner, inc.amount);
        }
    });

    // Migrate Expenses
    const insertExpense = db.prepare(`
        INSERT INTO expenses (id, name, amount, category_id, expense_type, payment_method, payment_status, year_month, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const migrateExpenses = db.transaction((expenses) => {
        for (const exp of expenses) {
            insertExpense.run(
                exp.id,
                exp.name,
                exp.amount,
                exp.category_id,
                exp.expense_type,
                exp.payment_method,
                exp.payment_status,
                exp.year_month,
                exp.created_at
            );
        }
    });

    try {
        if (data.categories?.length) migrateCategories(data.categories);
        if (data.incomes?.length) migrateIncomes(data.incomes);
        if (data.expenses?.length) migrateExpenses(data.expenses);

        // Update autoincrement sequences
        db.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'categories'").run(data.nextIds?.categories || 0);
        db.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'incomes'").run(data.nextIds?.incomes || 0);
        db.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'expenses'").run(data.nextIds?.expenses || 0);

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
