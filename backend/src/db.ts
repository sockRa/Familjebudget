import db from './db/sqlite.js';

// Allowed field names for each entity (prevents SQL injection via field names)
const ALLOWED_CATEGORY_FIELDS = ['name', 'color'] as const;
const ALLOWED_INCOME_FIELDS = ['name', 'owner', 'amount', 'year_month'] as const;
const ALLOWED_EXPENSE_FIELDS = [
  'name', 'amount', 'category_id', 'expense_type',
  'payment_method', 'payment_status', 'year_month',
  'overrides_expense_id', 'is_deleted', 'is_transfer'
] as const;

type CategoryField = typeof ALLOWED_CATEGORY_FIELDS[number];
type IncomeField = typeof ALLOWED_INCOME_FIELDS[number];
type ExpenseField = typeof ALLOWED_EXPENSE_FIELDS[number];

// Safe update builder using whitelisted fields
function buildSafeUpdate<T extends string>(
  allowedFields: readonly T[],
  updates: Record<string, any>
): { sql: string; params: any[] } {
  const sets: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key as T)) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
  }

  return { sql: sets.join(', '), params };
}

// Categories
export function getCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY name COLLATE NOCASE').all();
}

export function getCategoryById(id: number) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

export function createCategory(name: string, color: string = '#cccccc') {
  const result = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(name, color);
  return { id: Number(result.lastInsertRowid), name, color };
}

export function updateCategory(id: number, updates: Partial<Record<CategoryField, any>>) {
  const { sql, params } = buildSafeUpdate(ALLOWED_CATEGORY_FIELDS, updates);

  if (sql) {
    params.push(id);
    db.prepare(`UPDATE categories SET ${sql} WHERE id = ?`).run(...params);
  }
  return getCategoryById(id);
}

export function deleteCategory(id: number): boolean {
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return result.changes > 0;
}

// Incomes
export function getIncomes(yearMonth?: number) {
  let query = 'SELECT * FROM incomes';
  const params: any[] = [];

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

export function updateIncome(id: number, updates: Partial<Record<IncomeField, any>>) {
  const { sql, params } = buildSafeUpdate(ALLOWED_INCOME_FIELDS, updates);

  if (sql) {
    params.push(id);
    db.prepare(`UPDATE incomes SET ${sql} WHERE id = ?`).run(...params);
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
    return db.prepare(`
            SELECT e.*, c.name as category_name
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            ORDER BY e.expense_type = 'fixed' DESC, e.payment_method, e.name COLLATE NOCASE
        `).all();
  }

  const query = `
        SELECT e.*, c.name as category_name
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE 
            -- Fixed expenses without an override for this month (and not an override itself)
            (e.expense_type = 'fixed' AND e.overrides_expense_id IS NULL AND e.year_month IS NULL
             AND e.id NOT IN (SELECT overrides_expense_id FROM expenses WHERE year_month = ? AND overrides_expense_id IS NOT NULL))
            -- Variable expenses for this month (not overrides)
            OR (e.expense_type = 'variable' AND e.year_month = ? AND e.overrides_expense_id IS NULL)
            -- Fixed overrides for this month (excluding deleted ones)
            OR (e.expense_type = 'fixed' AND e.overrides_expense_id IS NOT NULL AND e.year_month = ? AND (e.is_deleted IS NULL OR e.is_deleted = 0))
        ORDER BY e.expense_type = 'fixed' DESC, e.payment_method, e.name COLLATE NOCASE
    `;

  return db.prepare(query).all(yearMonth, yearMonth, yearMonth);
}

export function getExpenseById(id: number) {
  return db.prepare(`
        SELECT e.*, c.name as category_name
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.id = ?
    `).get(id);
}

const capitalizedName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

export function createExpense(data: any) {
  const result = db.prepare(`
        INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, payment_status, year_month, is_transfer, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
    capitalizedName(data.name),
    data.amount,
    data.category_id ?? null,
    data.expense_type,
    data.payment_method,
    data.payment_status || 'unpaid',
    data.expense_type === 'fixed' ? null : (data.year_month ?? null),
    data.is_transfer ? 1 : 0,
    new Date().toISOString()
  );

  return getExpenseById(Number(result.lastInsertRowid));
}

export function updateExpense(id: number, updates: Partial<Record<ExpenseField, any>>) {
  const { sql, params } = buildSafeUpdate(ALLOWED_EXPENSE_FIELDS, updates);

  if (sql) {
    params.push(id);
    db.prepare(`UPDATE expenses SET ${sql} WHERE id = ?`).run(...params);
  }

  return getExpenseById(id);
}

export function deleteExpense(id: number): boolean {
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  return result.changes > 0;
}

// Create or update an override for a fixed expense
export function createExpenseOverride(originalExpenseId: number, yearMonth: number, overrideData: any) {
  const existing = db.prepare(`
        SELECT id FROM expenses 
        WHERE overrides_expense_id = ? AND year_month = ?
    `).get(originalExpenseId, yearMonth) as { id: number } | undefined;

  if (existing) {
    return updateExpense(existing.id, overrideData);
  }

  const original = getExpenseById(originalExpenseId) as any;
  if (!original) throw new Error('Original expense not found');

  const finalName = overrideData.name || original.name;
  const finalAmount = overrideData.amount !== undefined ? overrideData.amount : original.amount;
  const finalCategoryId = overrideData.category_id !== undefined ? overrideData.category_id : original.category_id;
  const finalPaymentMethod = overrideData.payment_method || original.payment_method;
  const finalPaymentStatus = overrideData.payment_status || original.payment_status || 'unpaid';

  const result = db.prepare(`
        INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, payment_status, year_month, overrides_expense_id, is_transfer, created_at)
        VALUES (?, ?, ?, 'fixed', ?, ?, ?, ?, ?, ?)
    `).run(
    capitalizedName(finalName),
    finalAmount,
    finalCategoryId,
    finalPaymentMethod,
    finalPaymentStatus,
    yearMonth,
    originalExpenseId,
    overrideData.is_transfer !== undefined ? (overrideData.is_transfer ? 1 : 0) : (original.is_transfer ? 1 : 0),
    new Date().toISOString()
  );

  return getExpenseById(Number(result.lastInsertRowid));
}

export function createDeletedOverride(originalExpenseId: number, yearMonth: number) {
  const existing = db.prepare(`
        SELECT id FROM expenses 
        WHERE overrides_expense_id = ? AND year_month = ?
    `).get(originalExpenseId, yearMonth) as { id: number } | undefined;

  if (existing) {
    db.prepare('UPDATE expenses SET is_deleted = 1 WHERE id = ?').run(existing.id);
    return getExpenseById(existing.id);
  }

  const original = getExpenseById(originalExpenseId) as any;
  if (!original) throw new Error('Original expense not found');

  const result = db.prepare(`
        INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, payment_status, year_month, overrides_expense_id, is_deleted, created_at)
        VALUES (?, ?, ?, 'fixed', ?, ?, ?, ?, 1, ?)
    `).run(
    original.name,
    original.amount,
    original.category_id,
    original.payment_method,
    original.payment_status,
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
  createDeletedOverride,
  getAllIncomes,
  getAllExpenses,
};
