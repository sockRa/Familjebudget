import { useState, useEffect, useMemo } from 'react';
import { Expense, Income, formatCurrency } from '../types';
import { expensesApi } from '../api';

interface PlanningPanelProps {
    expenses: Expense[];
    incomes: Income[];
    currentMonth: number;
    onUpdate: () => void;
}

interface SimulatedExpense extends Expense {
    simulatedAmount: number;
    isIncluded: boolean;
    isModified: boolean;
}

export function PlanningPanel({ expenses, incomes, currentMonth, onUpdate }: PlanningPanelProps) {
    const [simulatedExpenses, setSimulatedExpenses] = useState<SimulatedExpense[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize simulation state when expenses change
    useEffect(() => {
        setSimulatedExpenses(
            expenses
                .filter(e => e.category_name === 'Variabla fasta utgifter' || e.category_name === 'Ändringsbart')
                .map(e => ({
                    ...e,
                    simulatedAmount: e.amount,
                    isIncluded: true,
                    isModified: false
                }))
                .sort((a, b) => b.amount - a.amount)
        );
    }, [expenses]);

    const totalIncome = useMemo(() => incomes.reduce((sum, i) => sum + i.amount, 0), [incomes]);

    const originalTotalExpenses = useMemo(() =>
        expenses.reduce((sum, e) => sum + e.amount, 0),
        [expenses]);

    const simulatedTotalExpenses = useMemo(() =>
        simulatedExpenses
            .filter(e => e.isIncluded)
            .reduce((sum, e) => sum + e.simulatedAmount, 0),
        [simulatedExpenses]);

    const originalBalance = totalIncome - originalTotalExpenses;
    const simulatedBalance = totalIncome - simulatedTotalExpenses;

    const handleAmountChange = (id: number, amount: number) => {
        setSimulatedExpenses(prev => prev.map(e => {
            if (e.id !== id) return e;
            const original = expenses.find(exp => exp.id === id);
            return {
                ...e,
                simulatedAmount: amount,
                isModified: amount !== original?.amount || !e.isIncluded // simplistic modified check
            };
        }));
    };

    const handleToggleInclude = (id: number) => {
        setSimulatedExpenses(prev => prev.map(e => {
            if (e.id !== id) return e;
            return {
                ...e,
                isIncluded: !e.isIncluded,
                isModified: true
            };
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const modifiedExpenses = simulatedExpenses.filter(e => e.isModified);

            for (const expense of modifiedExpenses) {
                // If excluded, hide or delete
                if (!expense.isIncluded) {
                    if (expense.expense_type === 'fixed' && !expense.overrides_expense_id) {
                        await expensesApi.hideForMonth(expense.id, currentMonth);
                    } else {
                        await expensesApi.delete(expense.id);
                    }
                    continue;
                }

                // If included but amount changed
                const original = expenses.find(exp => exp.id === expense.id);
                if (original && expense.simulatedAmount !== original.amount) {
                    if (expense.expense_type === 'fixed' && !expense.overrides_expense_id) {
                        await expensesApi.createOverride(expense.id, currentMonth, { amount: expense.simulatedAmount });
                    } else {
                        await expensesApi.update(expense.id, { amount: expense.simulatedAmount });
                    }
                }
            }

            onUpdate();
        } catch (error) {
            console.error('Failed to save changes:', error);
            alert('Kunde inte spara ändringar.');
        } finally {
            setIsSaving(false);
        }
    };

    const getBalanceColor = (balance: number) => {
        if (balance > 0) return 'var(--color-success)';
        if (balance < 0) return 'var(--color-danger)';
        return 'var(--color-text-muted)';
    };

    return (
        <div className="planning-panel">
            {/* Header / Summary */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="section-header">
                    <span className="section-title">Budgetsimulering</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                    {/* Original */}
                    <div className="stat-card" style={{ padding: 'var(--space-md)' }}>
                        <div className="stat-label">Nuvarande Balans</div>
                        <div className="stat-value" style={{ color: getBalanceColor(originalBalance) }}>
                            {formatCurrency(originalBalance)}
                        </div>
                        <div className="stat-label" style={{ marginTop: 'var(--space-sm)' }}>
                            Utgifter: {formatCurrency(originalTotalExpenses)}
                        </div>
                    </div>

                    {/* Simulated */}
                    <div className="stat-card" style={{ padding: 'var(--space-md)', borderColor: 'var(--color-primary)' }}>
                        <div className="stat-label">Ny Balans</div>
                        <div className="stat-value" style={{ color: getBalanceColor(simulatedBalance) }}>
                            {formatCurrency(simulatedBalance)}
                        </div>
                        <div className="stat-label" style={{ marginTop: 'var(--space-sm)' }}>
                            Utgifter: {formatCurrency(simulatedTotalExpenses)}
                        </div>
                    </div>
                </div>

                {/* Diff Indicator */}
                <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
                    <span className="stat-label">Skillnad: </span>
                    <span className="stat-value" style={{
                        fontSize: 'var(--text-lg)',
                        color: simulatedBalance - originalBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>
                        {simulatedBalance - originalBalance > 0 ? '+' : ''}
                        {formatCurrency(simulatedBalance - originalBalance)}
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="card">
                <div className="section-header" style={{ position: 'static' }}>
                    <span className="section-title">Justera utgifter</span>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving || !simulatedExpenses.some(e => e.isModified)}
                    >
                        {isSaving ? 'Sparar...' : 'Spara ändringar'}
                    </button>
                </div>

                <div className="expense-list">
                    {simulatedExpenses.map(expense => (
                        <div
                            key={expense.id}
                            className={`expense-item ${!expense.isIncluded ? 'excluded' : ''}`}
                            style={{
                                opacity: expense.isIncluded ? 1 : 0.5,
                                borderLeft: expense.isModified ? '4px solid var(--color-warning)' : '1px solid var(--color-border)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <input
                                    type="checkbox"
                                    checked={expense.isIncluded}
                                    onChange={() => handleToggleInclude(expense.id)}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                    aria-label={`Inkludera ${expense.name} i beräkningen`}
                                    title="Inkludera/exkludera"
                                />
                            </div>

                            <div className="expense-info">
                                <div className="expense-meta">
                                    <span className="expense-name">{expense.name}</span>
                                    <span className="expense-category" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                                        {expense.category_name || 'Okategoriserad'}
                                    </span>
                                    {expense.expense_type === 'fixed' && (
                                        <span className="payment-chip" style={{ fontSize: '10px' }}>FAST</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                {expense.isIncluded ? (
                                    <input
                                        type="number"
                                        className="form-input"
                                        style={{ width: '100px', padding: '4px 8px', textAlign: 'right' }}
                                        value={expense.simulatedAmount}
                                        onChange={(e) => handleAmountChange(expense.id, parseInt(e.target.value) || 0)}
                                        aria-label={`Simulerat belopp för ${expense.name}`}
                                        title="Ange simulerat belopp"
                                    />
                                ) : (
                                    <span className="expense-amount" style={{ textDecoration: 'line-through' }}>
                                        {formatCurrency(expense.amount)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
