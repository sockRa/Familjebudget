import { useState } from 'react';
import { Income, formatYearMonth } from '../../types';
import { IncomeFormSchema, validateForm } from '../../shared/validation';

interface Settings {
    person1Name: string;
    person2Name: string;
}

interface IncomeModalProps {
    income: Income | null;
    settings: Settings;
    currentMonth: number;
    onSave: (data: { name: string; owner: 'jag' | 'fruga'; amount: number; year_month: number }) => void;
    onClose: () => void;
}

export function IncomeModal({
    income,
    settings,
    currentMonth,
    onSave,
    onClose,
}: IncomeModalProps) {
    const [name, setName] = useState(income?.name || '');
    const [owner, setOwner] = useState<'jag' | 'fruga'>(income?.owner as 'jag' | 'fruga' || 'jag');
    const [amount, setAmount] = useState(income?.amount?.toString() || '');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = {
            name: name.trim(),
            owner,
            amount: amount,
            year_month: currentMonth
        };

        const result = validateForm(IncomeFormSchema, formData);

        if (!result.success) {
            setErrors(result.errors);
            return;
        }

        setErrors({});
        onSave(result.data as { name: string; owner: 'jag' | 'fruga'; amount: number; year_month: number });
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
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                value={name}
                                onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                                placeholder="T.ex. Lön, Barnbidrag..."
                            />
                            {errors.name && <span className="form-error">{errors.name}</span>}
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
                                    className={`form-input ${errors.amount ? 'error' : ''}`}
                                    value={amount}
                                    onChange={e => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: '' })); }}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                />
                                {errors.amount && <span className="form-error">{errors.amount}</span>}
                            </div>
                        </div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-sm)' }}>
                            Gäller för: {formatYearMonth(currentMonth)}
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
