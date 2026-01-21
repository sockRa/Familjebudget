import { useState } from 'react';
import { Category } from '../types';
import { categoriesApi } from '../api';

interface CategoriesManagerProps {
    categories: Category[];
    onUpdate: () => void;
}

export function CategoriesManager({
    categories,
    onUpdate
}: CategoriesManagerProps) {
    const [newName, setNewName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async () => {
        if (!newName.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await categoriesApi.create({ name: newName });
            setNewName('');
            onUpdate();
        } catch (err) {
            console.error('Failed to add category:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Är du säker? Utgifter med denna kategori kommer bli utan kategori.')) return;
        try {
            await categoriesApi.delete(id);
            onUpdate();
        } catch (err) {
            console.error('Failed to delete category:', err);
        }
    };

    return (
        <div className="card">
            <div className="section-header">
                <span className="section-title">Kategorier</span>
            </div>
            <div className="expense-list" style={{ marginBottom: 'var(--space-lg)' }}>
                {categories.map(cat => (
                    <div key={cat.id} className="expense-item" style={{ gridTemplateColumns: '1fr auto' }}>
                        <span className="expense-name">{cat.name}</span>
                        <button
                            className="btn btn-icon btn-danger"
                            onClick={() => handleDelete(cat.id)}
                            aria-label={`Ta bort kategori ${cat.name}`}
                            title="Ta bort kategori"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="new-category" className="form-label">Ny kategori</label>
                    <input
                        id="new-category"
                        type="text"
                        className="form-input"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Kategorinamn"
                        disabled={isSubmitting}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleAdd}
                    style={{ height: 38 }}
                    disabled={isSubmitting || !newName.trim()}
                >
                    {isSubmitting ? 'Lägger till...' : 'Lägg till'}
                </button>
            </div>
        </div>
    );
}
