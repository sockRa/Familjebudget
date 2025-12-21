import { Expense, PaymentStatus, PAYMENT_STATUS_ICONS, formatCurrency } from '../types';

interface Settings {
    person1Name: string;
    person2Name: string;
}

interface ExpenseItemProps {
    expense: Expense;
    settings: Settings;
    onEdit: (e: Expense) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (id: number, status: PaymentStatus) => void;
}

export function ExpenseItem({
    expense,
    settings,
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

    const getPaymentMethodLabel = () => {
        switch (expense.payment_method) {
            case 'efaktura': return 'E-faktura';
            case 'autogiro_jag': return settings.person1Name;
            case 'autogiro_fruga': return settings.person2Name;
            case 'autogiro_gemensamt': return 'Gemensamt';
            default: return expense.payment_method;
        }
    };

    return (
        <div className="expense-item">
            <button
                className="expense-status-btn"
                onClick={cycleStatus}
                title={`Klicka för att ändra status`}
            >
                {PAYMENT_STATUS_ICONS[expense.payment_status || 'unpaid']}
            </button>
            <div className="expense-info">
                <span className="expense-name">{expense.name}</span>
                <div className="expense-meta">
                    <span className={`payment-chip ${expense.payment_method}`}>
                        {getPaymentMethodLabel()}
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
                <button className="btn btn-icon btn-secondary" onClick={() => onEdit(expense)}>✏️</button>
                <button className="btn btn-icon btn-danger" onClick={() => onDelete(expense.id)}>🗑️</button>
            </div>
        </div>
    );
}
