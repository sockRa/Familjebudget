import { default as BetterSqlite3, Database } from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || join(__dirname, '../../data');
const DB_FILE = join(DATA_DIR, 'budget.sqlite');

// Ensure data directory exists
mkdirSync(DATA_DIR, { recursive: true });

const db: Database = new BetterSqlite3(DB_FILE);

// Migration/Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    amount REAL NOT NULL,
    income_type TEXT NOT NULL DEFAULT 'fixed' CHECK(income_type IN ('fixed', 'variable')),
    year_month INTEGER
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL, 
    category_id INTEGER,
    expense_type TEXT NOT NULL CHECK(expense_type IN ('fixed', 'variable')),
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    year_month INTEGER,
    overrides_expense_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
    FOREIGN KEY (overrides_expense_id) REFERENCES expenses (id) ON DELETE CASCADE
  );
`);

// Migration: Add income_type and year_month columns to existing incomes table
try {
  db.exec(`ALTER TABLE incomes ADD COLUMN income_type TEXT NOT NULL DEFAULT 'fixed' CHECK(income_type IN ('fixed', 'variable'))`);
} catch (e) {
  // Column already exists
}
try {
  db.exec(`ALTER TABLE incomes ADD COLUMN year_month INTEGER`);
} catch (e) {
  // Column already exists
}

// Migration: Add overrides_expense_id column to existing expenses table
try {
  db.exec(`ALTER TABLE expenses ADD COLUMN overrides_expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE`);
} catch (e) {
  // Column already exists
}

// Migration: Add is_deleted column for soft-deleting fixed expenses per month
try {
  db.exec(`ALTER TABLE expenses ADD COLUMN is_deleted INTEGER DEFAULT 0`);
} catch (e) {
  // Column already exists
}

// Migration: Fix legacy payment method names
db.exec(`UPDATE expenses SET payment_method = 'efaktura_gemensamt' WHERE payment_method = 'efaktura'`);

export default db;
