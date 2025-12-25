import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Category, Income, Expense, MonthlyOverview, PaymentStatus, Settings,
    formatCurrency, formatYearMonth, getCurrentYearMonth, addMonths,
    getPaymentMethodLabel, getOwnerLabel, DEFAULT_SETTINGS
} from './types';
import { categoriesApi, incomesApi, expensesApi, overviewApi, settingsApi, ApiError } from './api';

// Components
import { SummaryCards } from './components/SummaryCards';
import { ExpenseItem } from './components/ExpenseItem';
import { CategoriesManager } from './components/CategoriesManager';
import { SettingsPanel } from './components/SettingsPanel';
import { ExpenseModal } from './components/Modals/ExpenseModal';
import { IncomeModal } from './components/Modals/IncomeModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { StatisticsPanel } from './components/StatisticsPanel';

type Tab = 'overview' | 'incomes' | 'categories' | 'settings' | 'statistics';

function App() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    });
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [currentMonth, setCurrentMonth] = useState(getCurrentYearMonth());
    const [isLoading, setIsLoading] = useState(true);
    const [isGroupingByCategory, setIsGroupingByCategory] = useState(true);
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    // Data
    const [categories, setCategories] = useState<Category[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [overview, setOverview] = useState<MonthlyOverview | null>(null);
    const [previousOverview, setPreviousOverview] = useState<MonthlyOverview | null>(null);

    // Modal state
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning' | 'info';
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Ref for main app container
    const appRef = useRef<HTMLDivElement>(null);

    // Theme effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Load settings from server
    useEffect(() => {
        settingsApi.get()
            .then(s => {
                setSettings(s);
                setSettingsLoaded(true);
            })
            .catch(err => {
                console.error('Failed to load settings:', err);
                setSettingsLoaded(true);
            });
    }, []);

    // Load data
    const loadData = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const previousMonth = addMonths(currentMonth, -1);
            const [cats, incs, exps, ov, prevOv] = await Promise.all([
                categoriesApi.getAll(),
                incomesApi.getAll(currentMonth),
                expensesApi.getAll(currentMonth),
                overviewApi.get(currentMonth),
                overviewApi.get(previousMonth).catch(() => null), // Silently fail for previous month
            ]);
            setCategories(cats);
            setIncomes(incs);
            setExpenses(exps);
            setOverview(ov);
            setPreviousOverview(prevOv);
        } catch (err) {
            console.error('Failed to load data:', err);
            if (err instanceof ApiError) {
                setError(err.getDetailedMessage());
            } else {
                setError('Kunde inte ladda data. Försök igen senare.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showExpenseModal || showIncomeModal || confirmDialog.isOpen) return;
            if (e.key === 'ArrowLeft') setCurrentMonth((m: number) => addMonths(m, -1));
            if (e.key === 'ArrowRight') setCurrentMonth((m: number) => addMonths(m, 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showExpenseModal, showIncomeModal, confirmDialog.isOpen]);


    useEffect(() => {
        loadData();
    }, [loadData]);

    // Helpers
    const showConfirm = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'warning' | 'info' = 'danger') => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm, variant });
    };

    const closeConfirm = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    // Filter by status
    const filterByStatus = (exps: Expense[]) => {
        if (statusFilter === 'all') return exps;
        return exps.filter(e => e.payment_status === statusFilter);
    };

    const toggleSection = (sectionId: string) => {
        setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const fixedExpenses = filterByStatus(expenses.filter(e => e.expense_type === 'fixed'));
    const variableExpenses = filterByStatus(expenses.filter(e => e.expense_type === 'variable'));

    const groupByPaymentMethod = (exps: Expense[]) => {
        const groups: Record<string, Expense[]> = {};
        exps.forEach(e => {
            if (!groups[e.payment_method]) groups[e.payment_method] = [];
            groups[e.payment_method].push(e);
        });
        return groups;
    };

    const groupByCategory = (exps: Expense[]) => {
        const groups: Record<string, Expense[]> = {};
        exps.forEach(e => {
            const catName = e.category_name || 'Övrigt';
            if (!groups[catName]) groups[catName] = [];
            groups[catName].push(e);
        });
        return groups;
    };

    // Handlers
    const handleSaveExpense = async (data: any) => {
        try {
            if (editingExpense) {
                if (editingExpense.expense_type === 'fixed' && !editingExpense.overrides_expense_id) {
                    const originalId = editingExpense.id;
                    await expensesApi.createOverride(originalId, currentMonth, data);
                } else {
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
        } catch (err) {
            console.error('Failed to save expense:', err);
            if (err instanceof ApiError) {
                setError(err.getDetailedMessage());
            } else if (err instanceof Error) {
                setError(err.message || 'Kunde inte spara utgift.');
            }
        }
    };

    const handleDeleteExpense = (id: number) => {
        showConfirm(
            'Ta bort utgift',
            'Är du säker på att du vill ta bort denna utgift?',
            async () => {
                try {
                    await expensesApi.delete(id);
                    loadData();
                } catch (err) {
                    console.error('Failed to delete expense:', err);
                    setError('Kunde inte ta bort utgift.');
                }
                closeConfirm();
            }
        );
    };

    const handleToggleStatus = async (id: number, status: PaymentStatus) => {
        const expense = expenses.find(e => e.id === id);
        if (!expense) return;

        // Optimistic update - update local state immediately
        setExpenses(prev => prev.map(e =>
            e.id === id ? { ...e, payment_status: status } : e
        ));

        try {
            if (expense.expense_type === 'fixed' && !expense.overrides_expense_id) {
                // Create override for status change
                await expensesApi.createOverride(id, currentMonth, { payment_status: status });
            } else {
                await expensesApi.update(id, { payment_status: status });
            }
            // Silently refresh in background to sync any server-side changes
            loadData();
        } catch (err) {
            console.error('Failed to update status:', err);
            // Revert on error
            setExpenses(prev => prev.map(e =>
                e.id === id ? { ...e, payment_status: expense.payment_status } : e
            ));
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
            if (err instanceof ApiError) {
                setError(err.getDetailedMessage());
            }
        }
    };

    const handleDeleteIncome = (id: number) => {
        showConfirm(
            'Ta bort inkomst',
            'Är du säker på att du vill ta bort denna inkomst?',
            async () => {
                try {
                    await incomesApi.delete(id);
                    loadData();
                } catch (err) {
                    console.error('Failed to delete income:', err);
                    setError('Kunde inte ta bort inkomst.');
                }
                closeConfirm();
            }
        );
    };

    const handleUpdateSettings = async (newSettings: Settings) => {
        try {
            const updated = await settingsApi.update(newSettings);
            setSettings(updated);
        } catch (err) {
            console.error('Failed to save settings:', err);
            setError('Kunde inte spara inställningar.');
        }
    };

    if (!settingsLoaded) {
        return (
            <div className="app loading-container">
                <div className="loading-spinner"></div>
                <p>Laddar...</p>
            </div>
        );
    }

    return (
        <div className="app" ref={appRef}>
            <header className="header">
                <h1>💰 Familjebudget</h1>
                <div className="header-controls">
                    <div className="month-selector">
                        <button className="btn btn-secondary" onClick={() => setCurrentMonth((m: number) => addMonths(m, -1))}>
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
                        <button className="btn btn-secondary" onClick={() => setCurrentMonth((m: number) => addMonths(m, 1))}>
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
                <button className={`tab ${activeTab === 'statistics' ? 'active' : ''}`} onClick={() => setActiveTab('statistics')}>
                    Statistik
                </button>
                <button className={`tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                    Kategorier
                </button>
                <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                    Inställningar
                </button>
            </div>

            {isLoading && activeTab === 'overview' && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                </div>
            )}

            {activeTab === 'overview' && overview && (
                <>
                    <SummaryCards overview={overview} previousOverview={previousOverview} settings={settings} />

                    {/* Status filter */}
                    <div className="filter-bar">
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Filter:</span>
                        <button
                            className={`btn btn-filter ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            Alla
                        </button>
                        <button
                            className={`btn btn-filter ${statusFilter === 'unpaid' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('unpaid')}
                        >
                            ❌ Obetalda
                        </button>
                        <button
                            className={`btn btn-filter ${statusFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('pending')}
                        >
                            ⏳ Pågående
                        </button>
                        <button
                            className={`btn btn-filter ${statusFilter === 'paid' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('paid')}
                        >
                            ✅ Betalda
                        </button>
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
                                <div
                                    className="payment-group-header clickable"
                                    onClick={() => toggleSection(`fixed-${method}`)}
                                >
                                    <span>
                                        {collapsedSections[`fixed-${method}`] ? '▶' : '▼'} {getPaymentMethodLabel(method as any, settings)}
                                    </span>
                                    <span className="payment-group-total">
                                        {formatCurrency(exps.reduce((s, e) => s + e.amount, 0))}
                                    </span>
                                </div>
                                {!collapsedSections[`fixed-${method}`] && (
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
                                )}
                            </div>
                        ))}
                        {fixedExpenses.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📝</div>
                                <p>Inga fasta utgifter{statusFilter !== 'all' ? ' med denna status' : ' ännu'}</p>
                            </div>
                        )}
                    </div>

                    {/* Variable expenses */}
                    <div className="expense-section">
                        <div className="section-header">
                            <span className="section-title">Variabla utgifter</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <button
                                    className={`btn btn-secondary ${!isGroupingByCategory ? 'active' : ''}`}
                                    onClick={() => setIsGroupingByCategory(false)}
                                    style={{ fontSize: 'var(--text-xs)', padding: '2px 8px' }}
                                >
                                    Lista
                                </button>
                                <button
                                    className={`btn btn-secondary ${isGroupingByCategory ? 'active' : ''}`}
                                    onClick={() => setIsGroupingByCategory(true)}
                                    style={{ fontSize: 'var(--text-xs)', padding: '2px 8px' }}
                                >
                                    Kategori
                                </button>
                                <span className="section-total">
                                    {formatCurrency(variableExpenses.reduce((s, e) => s + e.amount, 0))}
                                </span>
                            </div>
                        </div>

                        {isGroupingByCategory ? (
                            Object.entries(groupByCategory(variableExpenses)).map(([catName, exps]) => (
                                <div key={catName} style={{ marginBottom: 'var(--space-md)' }}>
                                    <div
                                        className="payment-group-header clickable"
                                        onClick={() => toggleSection(`var-${catName}`)}
                                    >
                                        <span>
                                            {collapsedSections[`var-${catName}`] ? '▶' : '▼'} {catName}
                                        </span>
                                        <span className="payment-group-total">
                                            {formatCurrency(exps.reduce((s, e) => s + e.amount, 0))}
                                        </span>
                                    </div>
                                    {!collapsedSections[`var-${catName}`] && (
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
                                    )}
                                </div>
                            ))
                        ) : (
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
                        )}

                        {variableExpenses.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">📦</div>
                                <p>Inga variabla utgifter{statusFilter !== 'all' ? ' med denna status' : ' denna månad'}</p>
                            </div>
                        )}
                    </div>

                    <button
                        className="fab"
                        onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }}
                        title="Lägg till utgift"
                    >
                        +
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
                                    {getOwnerLabel(income.owner as any, settings)}
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
                            <div className="empty-state-icon">💸</div>
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

            {activeTab === 'statistics' && (
                <StatisticsPanel currentMonth={currentMonth} settings={settings} />
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

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirm}
                variant={confirmDialog.variant}
            />
        </div>
    );
}

export default App;
