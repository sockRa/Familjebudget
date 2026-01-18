import { useState } from 'react';
import { Category, Expense } from '../../types';
import { categoriesApi } from '../../api';
import { ExpenseFormSchema, validateForm } from '../../shared/validation';

interface Settings {
    person1Name: string;
    person2Name: string;
}

interface ExpenseModalProps {
    expense: Expense | null;
    categories: Category[];
    settings: Settings;
    currentMonth: number;
    onSave: (data: any) => void;
    onClose: () => void;
    onCategoryCreated: () => void;
}

export function ExpenseModal({
    expense,
    categories,
    settings,
    currentMonth,
    onSave,
    onClose,
    onCategoryCreated,
}: ExpenseModalProps) {
    const [name, setName] = useState(expense?.name || '');
    const [amount, setAmount] = useState(expense?.amount?.toString() || '');
    const [categoryId, setCategoryId] = useState(expense?.category_id?.toString() || '');
    const [expenseType, setExpenseType] = useState(expense?.expense_type || 'fixed');
    const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method || 'autogiro_gemensamt');
    const [isTransfer, setIsTransfer] = useState(expense?.is_transfer === 1);
    const paymentStatus = expense?.payment_status || 'unpaid';

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // New category creation
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = {
            name: name.trim(),
            amount: amount,
            category_id: categoryId ? parseInt(categoryId) : null,
            expense_type: expenseType,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            is_transfer: isTransfer ? 1 : 0,
        };

        const result = validateForm(ExpenseFormSchema, formData);

        if (!result.success) {
            setErrors(result.errors);
            return;
        }

        setErrors({});
        onSave({
            ...result.data,
            year_month: expenseType === 'variable' ? currentMonth : null,
        });
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return;

        setIsCreatingCategory(true);
        try {
            const newCategory = await categoriesApi.create({
                name: newCategoryName.trim(),
            });
            setCategoryId(newCategory.id.toString());
            setShowNewCategory(false);
            setNewCategoryName('');
            onCategoryCreated();
        } catch (err) {
            console.error('Failed to create category:', err);
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleIsTransferChange = (checked: boolean) => {
        setIsTransfer(checked);
        if (checked) {
            setPaymentMethod('transfer');
        } else if (paymentMethod === 'transfer') {
            setPaymentMethod('autogiro_gemensamt');
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{expense ? 'Redigera utgift' : 'Ny utgift'}</h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose} aria-label="Stäng">✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label" htmlFor="expense-name">Namn</label>
                            <input
                                id="expense-name"
                                type="text"
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                value={name}
                                onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                                placeholder="T.ex. Hyra, Netflix..."
                                autoFocus
                                aria-invalid={!!errors.name}
                                aria-describedby={errors.name ? "name-error" : undefined}
                            />
                            {errors.name && <span id="name-error" className="form-error" role="alert">{errors.name}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="expense-amount">Belopp (kr)</label>
                            <input
                                id="expense-amount"
                                type="number"
                                className={`form-input ${errors.amount ? 'error' : ''}`}
                                value={amount}
                                onChange={e => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: '' })); }}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                aria-invalid={!!errors.amount}
                                aria-describedby={errors.amount ? "amount-error" : undefined}
                            />
                            {errors.amount && <span id="amount-error" className="form-error" role="alert">{errors.amount}</span>}
                        </div>

                        <div className="form-row" style={{ gap: 'var(--space-md)' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" htmlFor="expense-type">Typ</label>
                                <select
                                    id="expense-type"
                                    className="form-select"
                                    value={expenseType}
                                    onChange={e => setExpenseType(e.target.value as any)}
                                >
                                    <option value="fixed">Fast (varje månad)</option>
                                    <option value="variable">Variabel (endast denna månad)</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label" htmlFor="expense-category">Kategori</label>
                                {!showNewCategory ? (
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                        <select
                                            id="expense-category"
                                            className="form-select"
                                            value={categoryId}
                                            onChange={e => setCategoryId(e.target.value)}
                                            style={{ flex: 1 }}
                                        >
                                            <option value="">Ingen kategori</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setShowNewCategory(true)}
                                            title="Skapa ny kategori"
                                            aria-label="Skapa ny kategori"
                                            style={{ padding: '0 var(--space-sm)' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Kategorinamn"
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                            style={{ flex: 1, minWidth: '120px' }}
                                            aria-label="Namn på ny kategori"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleCreateCategory}
                                            disabled={isCreatingCategory || !newCategoryName.trim()}
                                            style={{ padding: '0 var(--space-sm)' }}
                                            title="Spara kategori"
                                            aria-label="Spara kategori"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                                            style={{ padding: '0 var(--space-sm)' }}
                                            title="Avbryt"
                                            aria-label="Avbryt skapande av kategori"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group" style={{
                            marginTop: 'var(--space-md)',
                            padding: 'var(--space-sm)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)'
                        }}>
                            <input
                                type="checkbox"
                                id="is_transfer"
                                checked={isTransfer}
                                onChange={(e) => handleIsTransferChange(e.target.checked)}
                                style={{ width: '1.2em', height: '1.2em' }}
                            />
                            <label htmlFor="is_transfer" style={{ marginBottom: 0, fontWeight: 500, cursor: 'pointer' }}>
                                Överföring (Inget betalsätt krävs)
                            </label>
                        </div>

                        {!isTransfer && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="payment-method">Betalningsmetod</label>
                                <select
                                    id="payment-method"
                                    className="form-select"
                                    value={paymentMethod === 'transfer' ? 'autogiro_gemensamt' : paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value as any)}
                                >
                                    <option value="efaktura_jag">📧 E-faktura ({settings.person1Name})</option>
                                    <option value="efaktura_fruga">📧 E-faktura ({settings.person2Name})</option>
                                    <option value="autogiro_jag">🔄 Autogiro ({settings.person1Name})</option>
                                    <option value="autogiro_fruga">🔄 Autogiro ({settings.person2Name})</option>
                                    <option value="autogiro_gemensamt">🔄 Autogiro (Gemensamt)</option>
                                </select>
                            </div>
                        )}
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
