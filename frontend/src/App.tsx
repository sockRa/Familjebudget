import { useState, useEffect, useCallback } from 'react';
import {
    Category, Income, Expense, MonthlyOverview, PaymentStatus,
    formatCurrency, formatYearMonth, getCurrentYearMonth, addMonths,
    PAYMENT_METHOD_LABELS
} from './types';
import { categoriesApi, incomesApi, expensesApi, overviewApi } from './api';

// Components
import { SummaryCards } from './components/SummaryCards';
import { ExpenseItem } from './components/ExpenseItem';
import { CategoriesManager } from './components/CategoriesManager';
import { SettingsPanel } from './components/SettingsPanel';
import { ExpenseModal } from './components/Modals/ExpenseModal';
import { IncomeModal } from './components/Modals/IncomeModal';

// Settings stored in localStorage
interface Settings {
    person1Name: string;
    person2Name: string;
}

const DEFAULT_SETTINGS: Settings = {
    person1Name: 'Person 1',
    person2Name: 'Person 2',
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
    const [error, setError] = useState<string | null>(null);

    // Theme effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Load data
    const loadData = useCallback(async () => {
        setError(null);
        try {
            const [cats, incs, exps, ov] = await Promise.all([
                categoriesApi.getAll(),
                incomesApi.getAll(currentMonth),
                expensesApi.getAll(currentMonth),
                overviewApi.get(currentMonth),
            ]);
            setCategories(cats);
            setIncomes(incs);
            setExpenses(exps);
            setOverview(ov);
        } catch (err: any) {
            console.error('Failed to load data:', err);
            setError('Kunde inte ladda data. Försök igen senare.');
        }
    }, [currentMonth]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showExpenseModal || showIncomeModal) return;
            if (e.key === 'ArrowLeft') setCurrentMonth(m => addMonths(m, -1));
            if (e.key === 'ArrowRight') setCurrentMonth(m => addMonths(m, 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showExpenseModal, showIncomeModal]);

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
    const handleSaveExpense = async (data: any) => {
        try {
            if (editingExpense) {
                // If editing a fixed expense, create an override for this month instead
                if (editingExpense.expense_type === 'fixed' && !editingExpense.overrides_expense_id) {
                    // Get the original expense ID (either this one, or what it overrides)
                    const originalId = editingExpense.id;
                    await expensesApi.createOverride(originalId, currentMonth, data);
                } else {
                    // Normal update (for variable expenses or existing overrides)
                    await expensesApi.update(editingExpense.id, data);
                }
            } else {
                await expensesApi.create({
                    ...data,
                    year_month: data.expense_type === 'variable' ? currentMonth : undefined,
                } as any);
            }
            setShowExpenseModal(false);
            setEditingExpense(null);
            loadData();
        } catch (err: any) {
            console.error('Failed to save expense:', err);
            setError(err.message || 'Kunde inte spara utgift.');
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

    const handleSaveIncome = async (data: { name: string; owner: string; amount: number; year_month: number }) => {
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
                        <div className="current-month-container">
                            <span className="current-month">{formatYearMonth(currentMonth)}</span>
                            {currentMonth !== getCurrentYearMonth() && (
                                <button
                                    className="btn btn-today"
                                    onClick={() => setCurrentMonth(getCurrentYearMonth())}
                                    title="Gå till nuvarande månad"
                                >
                                    Idag
                                </button>
                            )}
                        </div>
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

            {error && (
                <div className="error-banner">
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

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
                    <SummaryCards overview={overview} />

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
                                            settings={settings}
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
                                    settings={settings}
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
                        <span className="section-title">Inkomster ({formatYearMonth(currentMonth)})</span>
                        <span className="section-total">
                            {formatCurrency(incomes.reduce((s, i) => s + i.amount, 0))}
                        </span>
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
                            <div className="empty-state-icon">�</div>
                            <p>Inga inkomster denna månad</p>
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
                    settings={settings}
                    currentMonth={currentMonth}
                    onSave={handleSaveExpense}
                    onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }}
                    onCategoryCreated={loadData}
                />
            )}

            {/* Income Modal */}
            {showIncomeModal && (
                <IncomeModal
                    income={editingIncome}
                    settings={settings}
                    currentMonth={currentMonth}
                    onSave={handleSaveIncome}
                    onClose={() => { setShowIncomeModal(false); setEditingIncome(null); }}
                />
            )}
        </div>
    );
}

export default App;
