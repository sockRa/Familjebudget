import BetterSqlite3 from 'better-sqlite3';
import { existsSync } from 'fs';

const files = ['./data/budget.sqlite', './data/budget.db'];

files.forEach(file => {
    if (!existsSync(file)) {
        console.log(`\n--- ${file} NOT FOUND ---`);
        return;
    }
    console.log(`\n--- CHECKING ${file} ---`);
    try {
        const db = new BetterSqlite3(file);
        // Check if expenses table exists
        const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'").get();
        if (!tableCheck) {
            console.log('No "expenses" table found.');
        } else {
            const all = db.prepare('SELECT id, name, amount, payment_method, year_month FROM expenses').all();
            console.table(all);
        }
    } catch (err) {
        console.log(`Error reading ${file}: ${err.message}`);
    }
});
