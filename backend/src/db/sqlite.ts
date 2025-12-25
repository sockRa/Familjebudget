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

// Migration system
interface Migration {
  version: number;
  name: string;
  up: () => void;
}

// Create migrations table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

function getMigratedVersions(): number[] {
  const rows = db.prepare('SELECT version FROM _migrations ORDER BY version').all() as { version: number }[];
  return rows.map(r => r.version);
}

function runMigrations(migrations: Migration[]): void {
  const migratedVersions = getMigratedVersions();
  const pendingMigrations = migrations
    .filter(m => !migratedVersions.includes(m.version))
    .sort((a, b) => a.version - b.version);

  for (const migration of pendingMigrations) {
    console.log(`Running migration ${migration.version}: ${migration.name}`);
    try {
      db.transaction(() => {
        migration.up();
        db.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)').run(
          migration.version,
          migration.name
        );
      })();
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }
}

// Define all migrations
const migrations: Migration[] = [
  {
    version: 1,
    name: 'Initial schema',
    up: () => {
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
                    is_deleted INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
                    FOREIGN KEY (overrides_expense_id) REFERENCES expenses (id) ON DELETE CASCADE
                );
            `);
    },
  },
  {
    version: 2,
    name: 'Fix legacy efaktura payment method',
    up: () => {
      db.exec(`UPDATE expenses SET payment_method = 'efaktura_gemensamt' WHERE payment_method = 'efaktura'`);
    },
  },
  {
    version: 3,
    name: 'Add settings table',
    up: () => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                
                INSERT OR IGNORE INTO settings (key, value) VALUES ('person1Name', 'Person 1');
                INSERT OR IGNORE INTO settings (key, value) VALUES ('person2Name', 'Person 2');
            `);
    },
  },
  {
    version: 4,
    name: 'Add is_transfer column to expenses',
    up: () => {
      const info = db.prepare("PRAGMA table_info(expenses)").all() as any[];
      if (!info.find(c => c.name === 'is_transfer')) {
        db.exec(`ALTER TABLE expenses ADD COLUMN is_transfer INTEGER DEFAULT 0`);
      }
    },
  },
  {
    version: 5,
    name: 'Remove efaktura_gemensamt payment method',
    up: () => {
      db.exec(`UPDATE expenses SET payment_method = 'autogiro_gemensamt' WHERE payment_method = 'efaktura_gemensamt'`);
    },
  },
];

// Run migrations on startup
runMigrations(migrations);

export default db;
