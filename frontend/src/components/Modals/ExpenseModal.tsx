import { useState } from 'react';
import { Category, Expense } from '../../types';

interface ExpenseModalProps {
    expense: Expense | null;
    categories: Category[];
    currentMonth: number;
    onSave: (data: any) => void;
    onClose: () => void;
}

export function ExpenseModal({
    expense,
    categories,
    currentMonth,
    onSave,
    onClose,
}: ExpenseModalProps) {
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
