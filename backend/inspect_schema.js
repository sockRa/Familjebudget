import BetterSqlite3 from 'better-sqlite3';

const db = new BetterSqlite3('./data/budget.sqlite');
const info = db.prepare("PRAGMA table_info(categories)").all();
console.table(info);
