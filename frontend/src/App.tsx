import { useState, useEffect, useCallback } from 'react';
import {
    Category, Income, Expense, MonthlyOverview, PaymentStatus,
    formatCurrency, formatYearMonth, getCurrentYearMonth, addMonths,
    PAYMENT_METHOD_LABELS, PAYMENT_STATUS_ICONS
} from './types';
import { categoriesApi, incomesApi, expensesApi, overviewApi } from './api';

// Settings stored in localStorage
interface Settings {
    person1Name: string;
    person2Name: string;
    splitRatio: number; // 0.5 = 50/50
}

const DEFAULT_SETTINGS: Settings = {
    person1Name: 'Person 1',
    person2Name: 'Person 2',
    splitRatio: 0.5,
};

function getSettings(): Settings {
    const stored = localStorage.getItem('budget_settings');
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings) {
    localStorage.setItem('budget_settings', JSON.stringify(settings));
}

type Tab = 'overview' | 'incomes' | 'categories' | 'settings';

function App() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    });
    const [settings, setSettings] = useState<Settings>(getSettings);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [currentMonth, setCurrentMonth] = useState(getCurrentYearMonth());

    // Data
    const [categories, setCategories] = useState<Category[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [overview, setOverview] = useState<MonthlyOverview | null>(null);

    // Modal state
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);

    // Theme effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Load data
    const loadData = useCallback(async () => {
        try {
            const [cats, incs, exps, ov] = await Promise.all([
                categoriesApi.getAll(),
                incomesApi.getAll(),
                expensesApi.getAll(currentMonth),
                overviewApi.get(currentMonth),
            ]);
            setCategories(cats);
            setIncomes(incs);
            setExpenses(exps);
            setOverview(ov);
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    }, [currentMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Helpers
    const getOwnerLabel = (owner: string) =>
        owner === 'jag' ? settings.person1Name : settings.person2Name;

    const fixedExpenses = expenses.filter(e => e.expense_type === 'fixed');
    const variableExpenses = expenses.filter(e => e.expense_type === 'variable');

    const groupByPaymentMethod = (exps: Expense[]) => {
        const groups: Record<string, Expense[]> = {};
        exps.forEach(e => {
            if (!groups[e.payment_method]) groups[e.payment_method] = [];
            groups[e.payment_method].push(e);
        });
        return groups;
    };

    // Handlers
    const handleSaveExpense = async (data: Partial<Expense> & { name: string; amount: number; expense_type: string; payment_method: string }) => {
        try {
            if (editingExpense) {
                await expensesApi.update(editingExpense.id, data);
            } else {
                await expensesApi.create({
                    ...data,
                    year_month: data.expense_type === 'variable' ? currentMonth : undefined,
                } as any);
            }
            setShowExpenseModal(false);
            setEditingExpense(null);
            loadData();
        } catch (err) {
            console.error('Failed to save expense:', err);
        }
    };

    const handleDeleteExpense = async (id: number) => {
        if (!confirm('Är du säker på att du vill ta bort denna utgift?')) return;
        try {
            await expensesApi.delete(id);
            loadData();
        } catch (err) {
            console.error('Failed to delete expense:', err);
        }
    };

    const handleToggleStatus = async (id: number, status: PaymentStatus) => {
        try {
            await expensesApi.update(id, { payment_status: status });
            loadData();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleSaveIncome = async (data: { name: string; owner: string; amount: number }) => {
        try {
            if (editingIncome) {
                await incomesApi.update(editingIncome.id, data);
            } else {
                await incomesApi.create(data);
            }
            setShowIncomeModal(false);
            setEditingIncome(null);
            loadData();
        } catch (err) {
            console.error('Failed to save income:', err);
        }
    };

    const handleDeleteIncome = async (id: number) => {
        if (!confirm('Är du säker på att du vill ta bort denna inkomst?')) return;
        try {
            await incomesApi.delete(id);
            loadData();
        } catch (err) {
            console.error('Failed to delete income:', err);
        }
    };

    const handleUpdateSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        saveSettings(newSettings);
    };

    return (
        <div className="app">
            <header className="header">
                <h1>💰 Familjebudget</h1>
                <div className="header-controls">
                    <div className="month-selector">
                        <button className="btn btn-secondary" onClick={() => setCurrentMonth(m => addMonths(m, -1))}>
                            ◀
                        </button>
                        <span className="current-month">{formatYearMonth(currentMonth)}</span>
                        <button className="btn btn-secondary" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                            ▶
                        </button>
                    </div>
                    <button
                        className="theme-toggle"
                        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                        title={theme === 'dark' ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </header>

            <div className="tabs">
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    Översikt
                </button>
                <button className={`tab ${activeTab === 'incomes' ? 'active' : ''}`} onClick={() => setActiveTab('incomes')}>
                    Inkomster
                </button>
                <button className={`tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                    Kategorier
                </button>
                <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                    Inställningar
                </button>
            </div>

            {activeTab === 'overview' && overview && (
                <>
                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Inkomster</div>
                            <div className="stat-value">{formatCurrency(overview.totalIncome)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Utgifter</div>
                            <div className="stat-value">{formatCurrency(overview.totalExpenses)}</div>
                        </div>
                        <div className={`stat-card ${overview.balance >= 0 ? 'positive' : 'negative'}`}>
                            <div className="stat-label">Kvar</div>
                            <div className="stat-value">{formatCurrency(overview.balance)}</div>
                        </div>
                    </div>

                    {/* Fixed expenses */}
                    <div className="expense-section">
                        <div className="section-header">
                            <span className="section-title">Fasta utgifter</span>
                            <span className="section-total">
                                {formatCurrency(fixedExpenses.reduce((s, e) => s + e.amount, 0))}
                            </span>
                        </div>
                        {Object.entries(groupByPaymentMethod(fixedExpenses)).map(([method, exps]) => (
                            <div key={method} style={{ marginBottom: 'var(--space-md)' }}>
                                <div style={{
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--color-text-muted)',
                                    marginBottom: 'var(--space-xs)',
                                    paddingLeft: 'var(--space-sm)'
                                }}>
                                    {PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]}
                                </div>
                                <div className="expense-list">
                                    {exps.map(expense => (
                                        <ExpenseItem
                                            key={expense.id}
                                            expense={expense}
                                            onEdit={(e) => { setEditingExpense(e); setShowExpenseModal(true); }}
                                            onDelete={handleDeleteExpense}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {fixedExpenses.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📝</div>
                                <p>Inga fasta utgifter ännu</p>
                            </div>
                        )}
                    </div>

                    {/* Variable expenses */}
                    <div className="expense-section">
                        <div className="section-header">
                            <span className="section-title">Variabla utgifter ({formatYearMonth(currentMonth)})</span>
                            <span className="section-total">
                                {formatCurrency(variableExpenses.reduce((s, e) => s + e.amount, 0))}
                            </span>
                        </div>
                        <div className="expense-list">
                            {variableExpenses.map(expense => (
                                <ExpenseItem
                                    key={expense.id}
                                    expense={expense}
                                    onEdit={(e) => { setEditingExpense(e); setShowExpenseModal(true); }}
                                    onDelete={handleDeleteExpense}
                                    onToggleStatus={handleToggleStatus}
                                />
                            ))}
                        </div>
                        {variableExpenses.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📦</div>
                                <p>Inga variabla utgifter denna månad</p>
                            </div>
                        )}
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }}
                        style={{ width: '100%', padding: 'var(--space-md)' }}
                    >
                        + Lägg till utgift
                    </button>
                </>
            )}

            {activeTab === 'incomes' && (
                <div className="card">
                    <div className="section-header">
                        <span className="section-title">Inkomster</span>
                        <span className="section-total">{formatCurrency(incomes.reduce((s, i) => s + i.amount, 0))}</span>
                    </div>
                    <div className="income-list">
                        {incomes.map(income => (
                            <div key={income.id} className="income-item">
                                <span className={`income-owner ${income.owner}`}>
                                    {getOwnerLabel(income.owner)}
                                </span>
                                <span className="expense-name">{income.name}</span>
                                <span className="expense-amount">{formatCurrency(income.amount)}</span>
                                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                    <button
                                        className="btn btn-icon btn-secondary"
                                        onClick={() => { setEditingIncome(income); setShowIncomeModal(true); }}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn btn-icon btn-danger"
                                        onClick={() => handleDeleteIncome(income.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {incomes.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">💵</div>
                            <p>Inga inkomster tillagda</p>
                        </div>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={() => { setEditingIncome(null); setShowIncomeModal(true); }}
                        style={{ width: '100%', marginTop: 'var(--space-lg)', padding: 'var(--space-md)' }}
                    >
                        + Lägg till inkomst
                    </button>
                </div>
            )}

            {activeTab === 'categories' && (
                <CategoriesManager categories={categories} onUpdate={loadData} />
            )}

            {activeTab === 'settings' && (
                <SettingsPanel settings={settings} onSave={handleUpdateSettings} />
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <ExpenseModal
                    expense={editingExpense}
                    categories={categories}
                    currentMonth={currentMonth}
                    onSave={handleSaveExpense}
                    onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }}
                />
            )}

            {/* Income Modal */}
            {showIncomeModal && (
                <IncomeModal
                    income={editingIncome}
                    settings={settings}
                    onSave={handleSaveIncome}
                    onClose={() => { setShowIncomeModal(false); setEditingIncome(null); }}
                />
            )}
        </div>
    );
}

// ExpenseItem component
function ExpenseItem({
    expense,
    onEdit,
    onDelete,
    onToggleStatus
}: {
    expense: Expense;
    onEdit: (e: Expense) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (id: number, status: PaymentStatus) => void;
}) {
    const cycleStatus = () => {
        const statusOrder: PaymentStatus[] = ['unpaid', 'pending', 'paid'];
        const currentIndex = statusOrder.indexOf(expense.payment_status || 'unpaid');
        const nextStatus = statusOrder[(currentIndex + 1) % 3];
        onToggleStatus(expense.id, nextStatus);
    };

    return (
        <div className="expense-item">
            <button
                className="btn btn-icon"
                onClick={cycleStatus}
                title={`Status: ${expense.payment_status || 'unpaid'}`}
                style={{ fontSize: '1.2rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
                {PAYMENT_STATUS_ICONS[expense.payment_status || 'unpaid']}
            </button>
            <span className={`payment-chip ${expense.payment_method}`}>
                {expense.payment_method === 'efaktura' ? 'E-faktura' :
                    expense.payment_method === 'autogiro_jag' ? 'Jag' :
                        expense.payment_method === 'autogiro_fruga' ? 'Fruga' :
                            'Gemensamt'}
            </span>
            <span className="expense-name">{expense.name}</span>
            {expense.category_name && (
                <span
                    className="expense-category"
                    style={{ borderLeft: `3px solid ${expense.category_color || '#6366f1'}` }}
                >
                    {expense.category_name}
                </span>
            )}
            <span className="expense-amount">{formatCurrency(expense.amount)}</span>
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                <button className="btn btn-icon btn-secondary" onClick={() => onEdit(expense)}>✏️</button>
                <button className="btn btn-icon btn-danger" onClick={() => onDelete(expense.id)}>🗑️</button>
            </div>
        </div>
    );
}

// ExpenseModal component
function ExpenseModal({
    expense,
    categories,
    currentMonth,
    onSave,
    onClose,
}: {
    expense: Expense | null;
    categories: Category[];
    currentMonth: number;
    onSave: (data: any) => void;
    onClose: () => void;
}) {
    const [name, setName] = useState(expense?.name || '');
    const [amount, setAmount] = useState(expense?.amount?.toString() || '');
    const [categoryId, setCategoryId] = useState(expense?.category_id?.toString() || '');
    const [expenseType, setExpenseType] = useState(expense?.expense_type || 'fixed');
    const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method || 'efaktura');
    const paymentStatus = expense?.payment_status || 'unpaid';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            amount: parseFloat(amount),
            category_id: categoryId ? parseInt(categoryId) : null,
            expense_type: expenseType,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            year_month: expenseType === 'variable' ? currentMonth : null,
        });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{expense ? 'Redigera utgift' : 'Ny utgift'}</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Namn</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="T.ex. Hyra, Netflix..."
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Belopp (kr)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Typ</label>
                                <select
                                    className="form-select"
                                    value={expenseType}
                                    onChange={e => setExpenseType(e.target.value as any)}
                                >
                                    <option value="fixed">Fast (varje månad)</option>
                                    <option value="variable">Variabel (endast denna månad)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Kategori</label>
                                <select
                                    className="form-select"
                                    value={categoryId}
                                    onChange={e => setCategoryId(e.target.value)}
                                >
                                    <option value="">Ingen kategori</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Betalningsmetod</label>
                            <select
                                className="form-select"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value as any)}
                            >
                                <option value="efaktura">📧 E-faktura</option>
                                <option value="autogiro_jag">🔄 Autogiro (Person 1)</option>
                                <option value="autogiro_fruga">🔄 Autogiro (Person 2)</option>
                                <option value="autogiro_gemensamt">🔄 Autogiro (Gemensamt konto)</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Avbryt</button>
                        <button type="submit" className="btn btn-primary">Spara</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// IncomeModal component
function IncomeModal({
    income,
    settings,
    onSave,
    onClose,
}: {
    income: Income | null;
    settings: Settings;
    onSave: (data: { name: string; owner: string; amount: number }) => void;
    onClose: () => void;
}) {
    const [name, setName] = useState(income?.name || '');
    const [owner, setOwner] = useState<'jag' | 'fruga'>(income?.owner || 'jag');
    const [amount, setAmount] = useState(income?.amount?.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, owner, amount: parseFloat(amount) });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{income ? 'Redigera inkomst' : 'Ny inkomst'}</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Namn</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="T.ex. Lön, Barnbidrag..."
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Vem</label>
                                <select
                                    className="form-select"
                                    value={owner}
                                    onChange={e => setOwner(e.target.value as 'jag' | 'fruga')}
                                >
                                    <option value="jag">{settings.person1Name}</option>
                                    <option value="fruga">{settings.person2Name}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Belopp (kr)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Avbryt</button>
                        <button type="submit" className="btn btn-primary">Spara</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// CategoriesManager component
function CategoriesManager({
    categories,
    onUpdate
}: {
    categories: Category[];
    onUpdate: () => void;
}) {
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#6366f1');

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            await categoriesApi.create({ name: newName, color: newColor });
            setNewName('');
            onUpdate();
        } catch (err) {
            console.error('Failed to add category:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Är du säker? Utgifter med denna kategori kommer bli utan kategori.')) return;
        try {
            await categoriesApi.delete(id);
            onUpdate();
        } catch (err) {
            console.error('Failed to delete category:', err);
        }
    };

    return (
        <div className="card">
            <div className="section-header">
                <span className="section-title">Kategorier</span>
            </div>
            <div className="expense-list" style={{ marginBottom: 'var(--space-lg)' }}>
                {categories.map(cat => (
                    <div key={cat.id} className="expense-item" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: cat.color
                            }}
                        />
                        <span className="expense-name">{cat.name}</span>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(cat.id)}>🗑️</button>
                    </div>
                ))}
            </div>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Ny kategori</label>
                    <input
                        type="text"
                        className="form-input"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Kategorinamn"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Färg</label>
                    <input
                        type="color"
                        value={newColor}
                        onChange={e => setNewColor(e.target.value)}
                        style={{ width: 50, height: 38, border: 'none', cursor: 'pointer' }}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleAdd} style={{ height: 38 }}>
                    Lägg till
                </button>
            </div>
        </div>
    );
}

// SettingsPanel component
function SettingsPanel({
    settings,
    onSave
}: {
    settings: Settings;
    onSave: (s: Settings) => void;
}) {
    const [person1Name, setPerson1Name] = useState(settings.person1Name);
    const [person2Name, setPerson2Name] = useState(settings.person2Name);
    const [splitRatio, setSplitRatio] = useState((settings.splitRatio * 100).toString());

    const handleSave = () => {
        onSave({
            person1Name,
            person2Name,
            splitRatio: parseFloat(splitRatio) / 100,
        });
    };

    return (
        <div className="card">
            <div className="section-header">
                <span className="section-title">Inställningar</span>
            </div>
            <div className="form-group">
                <label className="form-label">Person 1 (visas som "Jag" i systemet)</label>
                <input
                    type="text"
                    className="form-input"
                    value={person1Name}
                    onChange={e => setPerson1Name(e.target.value)}
                    placeholder="Ditt namn"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Person 2 (visas som "Fruga" i systemet)</label>
                <input
                    type="text"
                    className="form-input"
                    value={person2Name}
                    onChange={e => setPerson2Name(e.target.value)}
                    placeholder="Partners namn"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Fördelning till gemensamt konto (%)</label>
                <div className="form-row">
                    <input
                        type="number"
                        className="form-input"
                        value={splitRatio}
                        onChange={e => setSplitRatio(e.target.value)}
                        min="0"
                        max="100"
                        placeholder="50"
                    />
                    <span style={{
                        alignSelf: 'center',
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap'
                    }}>
                        {person1Name}: {splitRatio}% / {person2Name}: {100 - parseFloat(splitRatio || '50')}%
                    </span>
                </div>
            </div>
            <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 'var(--space-md)' }}>
                Spara inställningar
            </button>
        </div>
    );
}

export default App;
