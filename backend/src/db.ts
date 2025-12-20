import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const DB_FILE = join(DATA_DIR, 'budget.json');

// Ensure data directory exists
mkdirSync(DATA_DIR, { recursive: true });

// Data structure
export interface DbData {
  categories: Array<{ id: number; name: string; color: string }>;
  incomes: Array<{ id: number; name: string; owner: string; amount: number }>;
  expenses: Array<{
    id: number;
    name: string;
    amount: number;
    category_id: number | null;
    expense_type: 'fixed' | 'variable';
    payment_method: string;
    payment_status: string;
    year_month: number | null;
    created_at: string;
  }>;
  nextIds: { categories: number; incomes: number; expenses: number };
}

// Default data with categories
const defaultData: DbData = {
  categories: [
    { id: 1, name: 'Boende', color: '#ef4444' },
    { id: 2, name: 'Mat', color: '#f97316' },
    { id: 3, name: 'Transport', color: '#eab308' },
    { id: 4, name: 'Nöje', color: '#22c55e' },
    { id: 5, name: 'Hälsa', color: '#06b6d4' },
    { id: 6, name: 'Övrigt', color: '#8b5cf6' },
  ],
  incomes: [],
  expenses: [],
  nextIds: { categories: 7, incomes: 1, expenses: 1 },
};

// Load or create database
function loadDb(): DbData {
  if (existsSync(DB_FILE)) {
    try {
      const content = readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error loading database, using defaults:', err);
      return { ...defaultData };
    }
  }
  // Save default data
  saveDb(defaultData);
  return { ...defaultData };
}

// Save database
function saveDb(data: DbData): void {
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Database instance
let db: DbData = loadDb();

// Helper functions
export function getDb(): DbData {
  return db;
}

export function save(): void {
  saveDb(db);
}

// Categories
export function getCategories() {
  return db.categories.slice().sort((a, b) => a.name.localeCompare(b.name, 'sv'));
}

export function getCategoryById(id: number) {
  return db.categories.find(c => c.id === id);
}

export function createCategory(name: string, color: string) {
  const id = db.nextIds.categories++;
  const category = { id, name, color };
  db.categories.push(category);
  save();
  return category;
}

export function updateCategory(id: number, updates: { name?: string; color?: string }) {
  const cat = db.categories.find(c => c.id === id);
  if (cat) {
    if (updates.name !== undefined) cat.name = updates.name;
    if (updates.color !== undefined) cat.color = updates.color;
    save();
  }
  return cat;
}

export function deleteCategory(id: number): boolean {
  const index = db.categories.findIndex(c => c.id === id);
  if (index >= 0) {
    db.categories.splice(index, 1);
    // Set category_id to null for affected expenses
    db.expenses.forEach(e => {
      if (e.category_id === id) e.category_id = null;
    });
    save();
    return true;
  }
  return false;
}

// Incomes
export function getIncomes() {
  return db.incomes.slice().sort((a, b) => a.owner.localeCompare(b.owner) || a.name.localeCompare(b.name, 'sv'));
}

export function getIncomeById(id: number) {
  return db.incomes.find(i => i.id === id);
}

export function createIncome(name: string, owner: string, amount: number) {
  const id = db.nextIds.incomes++;
  const income = { id, name, owner, amount };
  db.incomes.push(income);
  save();
  return income;
}

export function updateIncome(id: number, updates: { name?: string; owner?: string; amount?: number }) {
  const income = db.incomes.find(i => i.id === id);
  if (income) {
    if (updates.name !== undefined) income.name = updates.name;
    if (updates.owner !== undefined) income.owner = updates.owner;
    if (updates.amount !== undefined) income.amount = updates.amount;
    save();
  }
  return income;
}

export function deleteIncome(id: number): boolean {
  const index = db.incomes.findIndex(i => i.id === id);
  if (index >= 0) {
    db.incomes.splice(index, 1);
    save();
    return true;
  }
  return false;
}

// Expenses
export function getExpenses(yearMonth?: number) {
  let expenses = db.expenses.slice();

  if (yearMonth) {
    expenses = expenses.filter(e =>
      e.expense_type === 'fixed' || e.year_month === yearMonth
    );
  }

  // Add category info
  return expenses
    .map(e => {
      const cat = e.category_id ? getCategoryById(e.category_id) : null;
      return {
        ...e,
        category_name: cat?.name,
        category_color: cat?.color,
      };
    })
    .sort((a, b) => {
      if (a.expense_type !== b.expense_type) {
        return a.expense_type === 'fixed' ? -1 : 1;
      }
      return a.payment_method.localeCompare(b.payment_method) || a.name.localeCompare(b.name, 'sv');
    });
}

export function getExpenseById(id: number) {
  const expense = db.expenses.find(e => e.id === id);
  if (expense) {
    const cat = expense.category_id ? getCategoryById(expense.category_id) : null;
    return {
      ...expense,
      category_name: cat?.name,
      category_color: cat?.color,
    };
  }
  return undefined;
}

export function createExpense(data: {
  name: string;
  amount: number;
  category_id?: number | null;
  expense_type: 'fixed' | 'variable';
  payment_method: string;
  payment_status?: string;
  year_month?: number | null;
}) {
  const id = db.nextIds.expenses++;
  // Capitalize first letter of name
  const capitalizedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  const expense = {
    id,
    name: capitalizedName,
    amount: data.amount,
    category_id: data.category_id ?? null,
    expense_type: data.expense_type,
    payment_method: data.payment_method,
    payment_status: data.payment_status || 'unpaid',
    year_month: data.expense_type === 'fixed' ? null : (data.year_month ?? null),
    created_at: new Date().toISOString(),
  };
  db.expenses.push(expense);
  save();
  return getExpenseById(id);
}

export function updateExpense(id: number, updates: Partial<DbData['expenses'][0]>) {
  const expense = db.expenses.find(e => e.id === id);
  if (expense) {
    Object.assign(expense, updates);
    save();
  }
  return getExpenseById(id);
}

export function deleteExpense(id: number): boolean {
  const index = db.expenses.findIndex(e => e.id === id);
  if (index >= 0) {
    db.expenses.splice(index, 1);
    save();
    return true;
  }
  return false;
}

// For calculations
export function getAllIncomes() {
  return db.incomes;
}

export function getAllExpenses() {
  return db.expenses;
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
  getAllIncomes,
  getAllExpenses,
};
