import { useState } from 'react';
import { Income } from '../../types';

interface Settings {
    person1Name: string;
    person2Name: string;
    splitRatio: number;
}

interface IncomeModalProps {
    income: Income | null;
    settings: Settings;
    onSave: (data: { name: string; owner: 'jag' | 'fruga'; amount: number }) => void;
    onClose: () => void;
}

export function IncomeModal({
    income,
    settings,
    onSave,
    onClose,
}: IncomeModalProps) {
    const [name, setName] = useState(income?.name || '');
    const [owner, setOwner] = useState<'jag' | 'fruga'>(income?.owner as 'jag' | 'fruga' || 'jag');
    const [amount, setAmount] = useState(income?.amount?.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, owner, amount: parseFloat(amount) });
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
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="T.ex. Lön, Barnbidrag..."
                                required
                            />
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
                                    className="form-input"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
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
