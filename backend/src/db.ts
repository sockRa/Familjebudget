import db from './db/sqlite.js';
import { CategorySchema, IncomeSchema, ExpenseSchema } from './db/schemas.js';

// Categories
export function getCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY name COLLATE NOCASE').all();
}

export function getCategoryById(id: number) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

export function createCategory(name: string, color: string) {
  const result = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(name, color);
  return { id: Number(result.lastInsertRowid), name, color };
}

export function updateCategory(id: number, updates: { name?: string; color?: string }) {
  const sets = [];
  const params = [];
  if (updates.name !== undefined) { sets.push('name = ?'); params.push(updates.name); }
  if (updates.color !== undefined) { sets.push('color = ?'); params.push(updates.color); }

  if (sets.length > 0) {
    params.push(id);
    db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }
  return getCategoryById(id);
}

export function deleteCategory(id: number): boolean {
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  // SQLite doesn't automatically null out references unless configured with ON DELETE SET NULL
  // The schema already has ON DELETE SET NULL for category_id in expenses
  return result.changes > 0;
}

// Incomes
export function getIncomes(yearMonth?: number) {
  let query = 'SELECT * FROM incomes';
  const params = [];

  if (yearMonth) {
    query += ' WHERE year_month = ?';
    params.push(yearMonth);
  }

  query += ' ORDER BY owner, name COLLATE NOCASE';
  return db.prepare(query).all(...params);
}

export function getIncomeById(id: number) {
  return db.prepare('SELECT * FROM incomes WHERE id = ?').get(id);
}

export function createIncome(name: string, owner: string, amount: number, year_month: number) {
  const result = db.prepare('INSERT INTO incomes (name, owner, amount, year_month) VALUES (?, ?, ?, ?)').run(
    name, owner, amount, year_month
  );
  return { id: Number(result.lastInsertRowid), name, owner, amount, year_month };
}

export function updateIncome(id: number, updates: { name?: string; owner?: string; amount?: number; year_month?: number }) {
  const sets = [];
  const params = [];
  if (updates.name !== undefined) { sets.push('name = ?'); params.push(updates.name); }
  if (updates.owner !== undefined) { sets.push('owner = ?'); params.push(updates.owner); }
  if (updates.amount !== undefined) { sets.push('amount = ?'); params.push(updates.amount); }
  if (updates.year_month !== undefined) { sets.push('year_month = ?'); params.push(updates.year_month); }

  if (sets.length > 0) {
    params.push(id);
    db.prepare(`UPDATE incomes SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }
  return getIncomeById(id);
}

export function deleteIncome(id: number): boolean {
  const result = db.prepare('DELETE FROM incomes WHERE id = ?').run(id);
  return result.changes > 0;
}

// Expenses
export function getExpenses(yearMonth?: number) {
  if (!yearMonth) {
    // No month specified - return all expenses (for admin purposes)
    return db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      ORDER BY e.expense_type = 'fixed' DESC, e.payment_method, e.name COLLATE NOCASE
    `).all();
  }

  // Get:
  // 1. Fixed expenses that DON'T have an override for this month (and aren't overrides themselves)
  // 2. Variable expenses for this month (not overrides)
  // 3. Overrides for this month (have overrides_expense_id set)
  const query = `
    SELECT e.*, c.name as category_name, c.color as category_color
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE 
      -- Fixed expenses without an override for this month (and not an override itself)
      (e.expense_type = 'fixed' AND e.overrides_expense_id IS NULL AND e.year_month IS NULL
       AND e.id NOT IN (SELECT overrides_expense_id FROM expenses WHERE year_month = ? AND overrides_expense_id IS NOT NULL))
      -- Variable expenses for this month (not overrides)
      OR (e.expense_type = 'variable' AND e.year_month = ? AND e.overrides_expense_id IS NULL)
      -- Fixed overrides for this month
      OR (e.expense_type = 'fixed' AND e.overrides_expense_id IS NOT NULL AND e.year_month = ?)
    ORDER BY e.expense_type = 'fixed' DESC, e.payment_method, e.name COLLATE NOCASE
  `;

  return db.prepare(query).all(yearMonth, yearMonth, yearMonth);
}

export function getExpenseById(id: number) {
  return db.prepare(`
    SELECT e.*, c.name as category_name, c.color as category_color
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `).get(id);
}

export function createExpense(data: any) {
  // Capitalize first letter of name
  const capitalizedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);

  const result = db.prepare(`
    INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, payment_status, year_month, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    capitalizedName,
    data.amount,
    data.category_id ?? null,
    data.expense_type,
    data.payment_method,
    data.payment_status || 'unpaid',
    data.expense_type === 'fixed' ? null : (data.year_month ?? null),
    new Date().toISOString()
  );

  return getExpenseById(Number(result.lastInsertRowid));
}

export function updateExpense(id: number, updates: any) {
  const sets = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id') continue;
    sets.push(`${key} = ?`);
    params.push(value);
  }

  if (sets.length > 0) {
    params.push(id);
    db.prepare(`UPDATE expenses SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  return getExpenseById(id);
}

export function deleteExpense(id: number): boolean {
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  return result.changes > 0;
}

// Create or update an override for a fixed expense
export function createExpenseOverride(originalExpenseId: number, yearMonth: number, overrideData: any) {
  // Check if override already exists for this month
  const existing = db.prepare(`
    SELECT id FROM expenses 
    WHERE overrides_expense_id = ? AND year_month = ?
  `).get(originalExpenseId, yearMonth) as { id: number } | undefined;

  if (existing) {
    // Update existing override
    return updateExpense(existing.id, overrideData);
  }

  // Create new override - keep expense_type as 'fixed' so it shows in fixed section
  const capitalizedName = overrideData.name ?
    overrideData.name.charAt(0).toUpperCase() + overrideData.name.slice(1) :
    null;

  const result = db.prepare(`
    INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, payment_status, year_month, overrides_expense_id, created_at)
    VALUES (?, ?, ?, 'fixed', ?, ?, ?, ?, ?)
  `).run(
    capitalizedName || overrideData.name,
    overrideData.amount,
    overrideData.category_id ?? null,
    overrideData.payment_method,
    overrideData.payment_status || 'unpaid',
    yearMonth,
    originalExpenseId,
    new Date().toISOString()
  );

  return getExpenseById(Number(result.lastInsertRowid));
}

// For calculations
export function getAllIncomes() {
  return db.prepare('SELECT * FROM incomes').all();
}

export function getAllExpenses() {
  return db.prepare('SELECT * FROM expenses').all();
}

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  createExpenseOverride,
  getAllIncomes,
  getAllExpenses,
};
