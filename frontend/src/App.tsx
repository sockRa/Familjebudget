import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Category, Income, Expense, MonthlyOverview, PaymentStatus, Settings,
    formatCurrency, formatYearMonth, getCurrentYearMonth, addMonths,
    getOwnerLabel, DEFAULT_SETTINGS
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
import { PlanningPanel } from './components/PlanningPanel';

type Tab = 'overview' | 'incomes' | 'categories' | 'settings' | 'statistics' | 'planning';

function App() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    });
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [currentMonth, setCurrentMonth] = useState(getCurrentYearMonth());
    const [isLoading, setIsLoading] = useState(true);
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
        secondaryConfirmText?: string;
        onSecondaryConfirm?: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    // Ref for main app container
    const appRef = useRef<HTMLDivElement>(null);

    // Theme effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Load settings and categories from server
    const loadCategories = useCallback(async () => {
        try {
            const cats = await categoriesApi.getAll();
            setCategories(cats);
        } catch (err) {
            console.error('Failed to load categories:', err);
            // Non-critical, don't set global error
        }
    }, []);

    useEffect(() => {
        Promise.all([
            settingsApi.get().catch(err => {
                console.error('Failed to load settings:', err);
                return DEFAULT_SETTINGS;
            }),
            categoriesApi.getAll().catch(err => {
                console.error('Failed to load categories:', err);
                return [];
            })
        ]).then(([s, cats]) => {
            setSettings(s);
            setCategories(cats);
            setSettingsLoaded(true);
        });
    }, []);

    // Load data dependent on current month
    const loadMonthData = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const previousMonth = addMonths(currentMonth, -1);
            const [incs, exps, ov, prevOv] = await Promise.all([
                incomesApi.getAll(currentMonth),
                expensesApi.getAll(currentMonth),
                overviewApi.get(currentMonth),
                overviewApi.get(previousMonth).catch(() => null), // Silently fail for previous month
            ]);
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

    const loadAllData = useCallback(() => {
        loadCategories();
        loadMonthData();
    }, [loadCategories, loadMonthData]);

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
        loadMonthData();
    }, [loadMonthData]);

    // Helpers
    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, variant: 'danger' | 'warning' | 'info' = 'danger') => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm, variant });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }, []);

    const toggleSection = (sectionId: string) => {
        setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const filteredExpenses = useMemo(() => {
        if (statusFilter === 'all') return expenses;
        return expenses.filter(e => e.payment_status === statusFilter);
    }, [expenses, statusFilter]);

    const expenseGroups = useMemo(() => {
        const groups: { title: string, id: string, items: Expense[] }[] = [
            { title: 'Fasta avgifter (oföränderliga)', id: 'fixed-rigid', items: [] },
            { title: 'Autogiro', id: 'autogiro', items: [] },
            { title: 'E-fakturor', id: 'efaktura', items: [] },
            { title: 'Variabla fasta utgifter', id: 'variable-fixed', items: [] },
            { title: 'Ändringsbart (nöje, spar, etc.)', id: 'changeable', items: [] },
            { title: 'Övrigt', id: 'other', items: [] },
        ];

        filteredExpenses.forEach(e => {
            const isAG = e.payment_method.startsWith('autogiro');
            const isEF = e.payment_method.startsWith('efaktura');
            const isVarFixed = e.category_name === 'Variabla fasta utgifter';
            const isChangeable = e.category_name === 'Ändringsbart';

            if (e.expense_type === 'fixed' && !isAG && !isEF && !isVarFixed && !isChangeable) {
                groups[0].items.push(e);
            } else if (isAG) {
                groups[1].items.push(e);
            } else if (isEF) {
                groups[2].items.push(e);
            } else if (isVarFixed) {
                groups[3].items.push(e);
            } else if (isChangeable) {
                groups[4].items.push(e);
            } else {
                groups[5].items.push(e);
            }
        });

        // Sort items within groups
        groups.forEach(g => {
            if (g.id === 'autogiro') {
                // Gemensamt first, then others
                g.items.sort((a, b) => {
                    if (a.payment_method === 'autogiro_gemensamt' && b.payment_method !== 'autogiro_gemensamt') return -1;
                    if (a.payment_method !== 'autogiro_gemensamt' && b.payment_method === 'autogiro_gemensamt') return 1;
                    return a.name.localeCompare(b.name);
                });
            } else {
                g.items.sort((a, b) => a.name.localeCompare(b.name));
            }
        });

        return groups.filter(g => g.items.length > 0);
    }, [filteredExpenses]);


    // Handlers
    // Memoized handlers to prevent unnecessary re-renders of ExpenseItem
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
            loadMonthData();
        } catch (err) {
            console.error('Failed to save expense:', err);
            if (err instanceof ApiError) {
                setError(err.getDetailedMessage());
            } else if (err instanceof Error) {
                setError(err.message || 'Kunde inte spara utgift.');
            }
        }
    };

    const handleDeleteExpense = useCallback((expense: Expense) => {
        // For fixed expenses without override, give option to delete permanently or just for this month
        const isBaseFixedExpense = expense.expense_type === 'fixed' && !expense.overrides_expense_id;

        const deleteAction = async (permanent: boolean) => {
            try {
                if (isBaseFixedExpense && !permanent) {
                    await expensesApi.hideForMonth(expense.id, currentMonth);
                } else {
                    await expensesApi.delete(expense.id);
                }
                await loadMonthData();
            } catch (err) {
                console.error('Failed to delete expense:', err);
                setError('Kunde inte ta bort utgift.');
            }
            closeConfirm();
        };

        if (isBaseFixedExpense) {
            setConfirmDialog({
                isOpen: true,
                title: 'Ta bort fast utgift',
                message: 'Vill du ta bort denna utgift permanent (alla månader) eller bara för denna månad?',
                onConfirm: () => deleteAction(true),
                secondaryConfirmText: 'Endast denna månad',
                onSecondaryConfirm: () => deleteAction(false),
            });
        } else {
            showConfirm(
                'Ta bort utgift',
                'Är du säker på att du vill ta bort denna utgift?',
                () => deleteAction(true)
            );
        }
    }, [currentMonth, loadMonthData, closeConfirm, showConfirm]);

    const handleToggleStatus = useCallback(async (expense: Expense, status: PaymentStatus) => {
        // Optimistic update - update local state immediately
        setExpenses(prev => prev.map(e =>
            e.id === expense.id ? { ...e, payment_status: status } : e
        ));

        try {
            if (expense.expense_type === 'fixed' && !expense.overrides_expense_id) {
                // Create override for status change
                await expensesApi.createOverride(expense.id, currentMonth, { payment_status: status });
            } else {
                await expensesApi.update(expense.id, { payment_status: status });
            }
            // Silently refresh in background to sync any server-side changes
            loadMonthData();
        } catch (err) {
            console.error('Failed to update status:', err);
            // Revert on error
            setExpenses(prev => prev.map(e =>
                e.id === expense.id ? { ...e, payment_status: expense.payment_status } : e
            ));
        }
    }, [currentMonth, loadMonthData]);

    // Memoized to keep ExpenseItem props stable
    const handleEditExpense = useCallback((e: Expense) => {
        setEditingExpense(e);
        setShowExpenseModal(true);
    }, []);

    const handleSaveIncome = async (data: { name: string; owner: string; amount: number; year_month: number }) => {
        try {
            if (editingIncome) {
                await incomesApi.update(editingIncome.id, data);
            } else {
                await incomesApi.create(data);
            }
            setShowIncomeModal(false);
            setEditingIncome(null);
            loadMonthData();
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
                    await loadMonthData();
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
                        <button
                            className="btn btn-secondary"
                            onClick={() => setCurrentMonth((m: number) => addMonths(m, -1))}
                            aria-label="Föregående månad"
                        >
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
                        <button
                            className="btn btn-secondary"
                            onClick={() => setCurrentMonth((m: number) => addMonths(m, 1))}
                            aria-label="Nästa månad"
                        >
                            ▶
                        </button>
                    </div>
                    <button
                        className="theme-toggle"
                        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                        title={theme === 'dark' ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
                        aria-label={theme === 'dark' ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
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
                <button className={`tab ${activeTab === 'planning' ? 'active' : ''}`} onClick={() => setActiveTab('planning')}>
                    Planering
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
                            aria-pressed={statusFilter === 'all'}
                        >
                            Alla
                        </button>
                        <button
                            className={`btn btn-filter ${statusFilter === 'unpaid' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('unpaid')}
                            aria-pressed={statusFilter === 'unpaid'}
                        >
                            ❌ Obetalda
                        </button>
                        <button
                            className={`btn btn-filter ${statusFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('pending')}
                            aria-pressed={statusFilter === 'pending'}
                        >
                            ⏳ Pågående
                        </button>
                        <button
                            className={`btn btn-filter ${statusFilter === 'paid' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('paid')}
                            aria-pressed={statusFilter === 'paid'}
                        >
                            ✅ Betalda
                        </button>
                    </div>

                    {/* Grouped expenses list */}
                    {expenseGroups.map(group => (
                        <div key={group.id} className="expense-section">
                            <button
                                type="button"
                                className="section-header clickable"
                                onClick={() => toggleSection(group.id)}
                                aria-expanded={!collapsedSections[group.id]}
                                style={{ width: '100%', border: 'none', background: 'var(--color-bg)', textAlign: 'inherit' }}
                            >
                                <span className="section-title">
                                    {collapsedSections[group.id] ? '▶' : '▼'} {group.title}
                                </span>
                                <span className="section-total">
                                    {formatCurrency(group.items.reduce((s, e) => s + e.amount, 0))}
                                </span>
                            </button>
                            {!collapsedSections[group.id] && (
                                <div className="expense-list">
                                    {group.items.map(expense => (
                                        <ExpenseItem
                                            key={expense.id}
                                            expense={expense}
                                            settings={settings}
                                            onEdit={handleEditExpense}
                                            onDelete={handleDeleteExpense}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {expenseGroups.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <p>Inga utgifter{statusFilter !== 'all' ? ' med denna status' : ' ännu'}</p>
                        </div>
                    )}

                    <button
                        className="fab"
                        onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }}
                        title="Lägg till utgift"
                        aria-label="Lägg till utgift"
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
                                        aria-label={`Redigera ${income.name}`}
                                        title="Redigera"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn btn-icon btn-danger"
                                        onClick={() => handleDeleteIncome(income.id)}
                                        aria-label={`Ta bort ${income.name}`}
                                        title="Ta bort"
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

            {activeTab === 'planning' && (
                <PlanningPanel
                    expenses={expenses}
                    incomes={incomes}
                    currentMonth={currentMonth}
                    onUpdate={loadMonthData}
                />
            )}

            {activeTab === 'categories' && (
                <CategoriesManager categories={categories} onUpdate={loadAllData} />
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
                    onCategoryCreated={loadCategories}
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
                confirmText="Ta bort permanent"
                secondaryConfirmText={confirmDialog.secondaryConfirmText}
                onSecondaryConfirm={confirmDialog.onSecondaryConfirm}
            />
        </div>
    );
}

export default App;
