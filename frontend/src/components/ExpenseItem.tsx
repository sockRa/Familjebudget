import { memo } from 'react';
import { Expense, PaymentStatus, PAYMENT_STATUS_ICONS, PAYMENT_STATUS_LABELS, formatCurrency, getPaymentMethodLabel } from '../types';

interface Settings {
    person1Name: string;
    person2Name: string;
}

interface ExpenseItemProps {
    expense: Expense;
    settings: Settings;
    onEdit: (e: Expense) => void;
    onDelete: (expense: Expense) => void;
    onToggleStatus: (expense: Expense, status: PaymentStatus) => void;
}

// Memoized component to prevent re-renders when parent state changes but props remain stable
export const ExpenseItem = memo(function ExpenseItem({
    expense,
    settings,
    onEdit,
    onDelete,
    onToggleStatus
}: ExpenseItemProps) {
    const statusOrder: PaymentStatus[] = ['unpaid', 'pending', 'paid'];
    const currentIndex = statusOrder.indexOf(expense.payment_status || 'unpaid');
    const nextStatus = statusOrder[(currentIndex + 1) % 3];

    const cycleStatus = () => {
        onToggleStatus(expense, nextStatus);
    };

    const currentStatusLabel = PAYMENT_STATUS_LABELS[expense.payment_status || 'unpaid'];
    const nextStatusLabel = PAYMENT_STATUS_LABELS[nextStatus];

    return (
        <div className={`expense-item ${expense.is_transfer ? 'is-transfer' : ''}`}>
            <button
                className="expense-status-btn"
                onClick={cycleStatus}
                title={`Klicka för att ändra status till ${nextStatusLabel}`}
                aria-label={`Status: ${currentStatusLabel}. Klicka för att ändra till ${nextStatusLabel}`}
            >
                {PAYMENT_STATUS_ICONS[expense.payment_status || 'unpaid']}
            </button>
            <div className="expense-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <span className="expense-name">{expense.name}</span>
                    {expense.is_transfer === 1 && <span className="transfer-badge">Överföring</span>}
                </div>
                <div className="expense-meta">
                    <span className={`payment-chip ${expense.payment_method}`}>
                        {getPaymentMethodLabel(expense.payment_method, settings)}
                    </span>
                    {expense.category_name && (
                        <span className="expense-category">
                            {expense.category_name}
                        </span>
                    )}
                </div>
            </div>
            <span className="expense-amount">{formatCurrency(expense.amount)}</span>
            <div className="expense-actions">
                <button
                    className="btn btn-icon btn-secondary"
                    onClick={() => onEdit(expense)}
                    aria-label={`Redigera ${expense.name}`}
                    title="Redigera"
                >
                    ✏️
                </button>
                <button
                    className="btn btn-icon btn-danger"
                    onClick={() => onDelete(expense)}
                    aria-label={`Ta bort ${expense.name}`}
                    title="Ta bort"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
});
