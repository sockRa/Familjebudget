import db from './db/sqlite.js';
import type { Statement } from 'better-sqlite3';

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

// Prepared Statements Cache
const statements: Record<string, Statement> = {
  // Categories
  getAllCategories: db.prepare('SELECT * FROM categories ORDER BY name COLLATE NOCASE'),
  getCategoryById: db.prepare('SELECT * FROM categories WHERE id = ?'),
  insertCategory: db.prepare('INSERT INTO categories (name, color) VALUES (?, ?) RETURNING *'),
  deleteCategory: db.prepare('DELETE FROM categories WHERE id = ?'),

  // Incomes
  getAllIncomes: db.prepare('SELECT * FROM incomes ORDER BY owner, name COLLATE NOCASE'),
  getIncomesByMonth: db.prepare('SELECT * FROM incomes WHERE year_month = ? ORDER BY owner, name COLLATE NOCASE'),
  getIncomeById: db.prepare('SELECT * FROM incomes WHERE id = ?'),
  insertIncome: db.prepare('INSERT INTO incomes (name, owner, amount, year_month) VALUES (?, ?, ?, ?) RETURNING *'),
  deleteIncome: db.prepare('DELETE FROM incomes WHERE id = ?'),
  getAllIncomesRaw: db.prepare('SELECT * FROM incomes'),

  // Expenses
  getAllExpensesNoMonth: db.prepare(`
            SELECT e.*, c.name as category_name
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
        `),
  getExpensesByMonth: db.prepare(`
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
    `),
  getExpenseById: db.prepare(`
        SELECT e.*, c.name as category_name
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.id = ?
    `),
  insertExpense: db.prepare(`
        INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, payment_status, year_month, is_transfer, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
    `),
  deleteExpense: db.prepare('DELETE FROM expenses WHERE id = ?'),
  findOverride: db.prepare(`
        SELECT id FROM expenses
        WHERE overrides_expense_id = ? AND year_month = ?
    `),
  insertOverride: db.prepare(`
        INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, payment_status, year_month, overrides_expense_id, is_transfer, created_at)
        VALUES (?, ?, ?, 'fixed', ?, ?, ?, ?, ?, ?)
        RETURNING *
    `),
  insertDeletedOverride: db.prepare(`
        INSERT INTO expenses (name, amount, category_id, expense_type, payment_method, payment_status, year_month, overrides_expense_id, is_deleted, created_at)
        VALUES (?, ?, ?, 'fixed', ?, ?, ?, ?, 1, ?)
        RETURNING *
    `),
  updateOverrideDeleted: db.prepare('UPDATE expenses SET is_deleted = 1 WHERE id = ?'),
  getAllExpensesRaw: db.prepare('SELECT * FROM expenses'),
  getExpenseMonths: db.prepare(`
    SELECT DISTINCT year_month
    FROM expenses
    WHERE year_month IS NOT NULL
    ORDER BY year_month DESC
  `),
  getExpensesForOverview: db.prepare(`
        SELECT amount, payment_method, payment_status, is_transfer
        FROM expenses e
        WHERE
            -- Fixed expenses without an override for this month (and not an override itself)
            (e.expense_type = 'fixed' AND e.overrides_expense_id IS NULL AND e.year_month IS NULL
             AND (e.is_deleted IS NULL OR e.is_deleted = 0)
             AND e.id NOT IN (SELECT overrides_expense_id FROM expenses WHERE year_month = ? AND overrides_expense_id IS NOT NULL))
            -- Variable expenses for this month (not overrides)
            OR (e.expense_type = 'variable' AND e.year_month = ? AND e.overrides_expense_id IS NULL
                AND (e.is_deleted IS NULL OR e.is_deleted = 0))
            -- Fixed overrides for this month (excluding deleted ones)
            OR (e.expense_type = 'fixed' AND e.overrides_expense_id IS NOT NULL AND e.year_month = ? AND (e.is_deleted IS NULL OR e.is_deleted = 0))
    `),
  getIncomesForOverview: db.prepare('SELECT amount FROM incomes WHERE year_month = ?'),
};

// Categories
export function getCategories() {
  return statements.getAllCategories.all();
}

export function getCategoryById(id: number) {
  return statements.getCategoryById.get(id);
}

export function createCategory(name: string, color: string = '#cccccc') {
  // Optimization: Use RETURNING * to avoid a separate SELECT query
  return statements.insertCategory.get(name, color);
}

export function updateCategory(id: number, updates: Partial<Record<CategoryField, any>>) {
  const { sql, params } = buildSafeUpdate(ALLOWED_CATEGORY_FIELDS, updates);

  if (sql) {
    params.push(id);
    // Optimization: Use RETURNING * to avoid a separate SELECT query
    const result = db.prepare(`UPDATE categories SET ${sql} WHERE id = ? RETURNING *`).get(...params);
    return result;
  }
  return getCategoryById(id);
}

export function deleteCategory(id: number): boolean {
  const result = statements.deleteCategory.run(id);
  return result.changes > 0;
}

// Incomes
export function getIncomes(yearMonth?: number) {
  if (yearMonth) {
    return statements.getIncomesByMonth.all(yearMonth);
  }
  return statements.getAllIncomes.all();
}

export function getIncomeById(id: number) {
  return statements.getIncomeById.get(id);
}

export function createIncome(name: string, owner: string, amount: number, year_month: number) {
  // Optimization: Use RETURNING * to avoid a separate SELECT query
  return statements.insertIncome.get(name, owner, amount, year_month);
}

export function updateIncome(id: number, updates: Partial<Record<IncomeField, any>>) {
  const { sql, params } = buildSafeUpdate(ALLOWED_INCOME_FIELDS, updates);

  if (sql) {
    params.push(id);
    // Optimization: Use RETURNING * to avoid a separate SELECT query
    const result = db.prepare(`UPDATE incomes SET ${sql} WHERE id = ? RETURNING *`).get(...params);
    return result;
  }
  return getIncomeById(id);
}

export function deleteIncome(id: number): boolean {
  const result = statements.deleteIncome.run(id);
  return result.changes > 0;
}

// Expenses
export function getExpenses(yearMonth?: number) {
  if (!yearMonth) {
    return statements.getAllExpensesNoMonth.all();
  }
  return statements.getExpensesByMonth.all(yearMonth, yearMonth, yearMonth);
}

export function getExpenseById(id: number) {
  return statements.getExpenseById.get(id);
}

const capitalizedName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

export function createExpense(data: any) {
  // Optimization: Use RETURNING * to avoid a separate SELECT query
  return statements.insertExpense.get(
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
}

export function updateExpense(id: number, updates: Partial<Record<ExpenseField, any>>) {
  const { sql, params } = buildSafeUpdate(ALLOWED_EXPENSE_FIELDS, updates);

  if (sql) {
    params.push(id);
    // Optimization: Use RETURNING *
    return db.prepare(`UPDATE expenses SET ${sql} WHERE id = ? RETURNING *`).get(...params);
  }

  return getExpenseById(id);
}

export function deleteExpense(id: number): boolean {
  const result = statements.deleteExpense.run(id);
  return result.changes > 0;
}

// Create or update an override for a fixed expense
export function createExpenseOverride(originalExpenseId: number, yearMonth: number, overrideData: any) {
  const existing = statements.findOverride.get(originalExpenseId, yearMonth) as { id: number } | undefined;

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

  // Optimization: Use RETURNING *
  return statements.insertOverride.get(
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
}

export function createDeletedOverride(originalExpenseId: number, yearMonth: number) {
  const existing = statements.findOverride.get(originalExpenseId, yearMonth) as { id: number } | undefined;

  if (existing) {
    statements.updateOverrideDeleted.run(existing.id);
    return getExpenseById(existing.id);
  }

  const original = getExpenseById(originalExpenseId) as any;
  if (!original) throw new Error('Original expense not found');

  // Optimization: Use RETURNING *
  return statements.insertDeletedOverride.get(
    original.name,
    original.amount,
    original.category_id,
    original.payment_method,
    original.payment_status,
    yearMonth,
    originalExpenseId,
    new Date().toISOString()
  );
}

// For calculations
export function getAllIncomes() {
  return statements.getAllIncomesRaw.all();
}

export function getAllExpenses() {
  return statements.getAllExpensesRaw.all();
}

export function getExpenseMonths() {
  const rows = statements.getExpenseMonths.all() as { year_month: number }[];
  return rows.map(r => r.year_month);
}

export function getExpensesForOverview(yearMonth: number) {
  return statements.getExpensesForOverview.all(yearMonth, yearMonth, yearMonth);
}

export function getIncomesForOverview(yearMonth: number) {
  return statements.getIncomesForOverview.all(yearMonth);
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
  getExpenseMonths,
  getExpensesForOverview,
  getIncomesForOverview,
};
