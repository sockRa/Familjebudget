import { Expense, PaymentStatus, PAYMENT_STATUS_ICONS, formatCurrency } from '../types';

interface ExpenseItemProps {
    expense: Expense;
    onEdit: (e: Expense) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (id: number, status: PaymentStatus) => void;
}

export function ExpenseItem({
    expense,
    onEdit,
    onDelete,
    onToggleStatus
}: ExpenseItemProps) {
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
