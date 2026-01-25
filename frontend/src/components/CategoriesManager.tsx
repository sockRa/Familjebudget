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
    const [isAdding, setIsAdding] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsAdding(true);
        try {
            await categoriesApi.create({ name: newName });
            setNewName('');
            onUpdate();
        } catch (err) {
            console.error('Failed to add category:', err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Är du säker? Utgifter med denna kategori kommer bli utan kategori.')) return;

        setDeletingIds(prev => new Set(prev).add(id));
        try {
            await categoriesApi.delete(id);
            onUpdate();
        } catch (err) {
            console.error('Failed to delete category:', err);
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    return (
        <div className="card">
            <div className="section-header">
                <span className="section-title">Kategorier</span>
            </div>
            <div className="expense-list" style={{ marginBottom: 'var(--space-lg)' }}>
                {categories.map(cat => {
                    const isDeleting = deletingIds.has(cat.id);
                    return (
                        <div key={cat.id} className="expense-item" style={{ gridTemplateColumns: '1fr auto' }}>
                            <span className="expense-name">{cat.name}</span>
                            <button
                                className="btn btn-icon btn-danger"
                                onClick={() => handleDelete(cat.id)}
                                aria-label={`Ta bort kategori ${cat.name}`}
                                title="Ta bort kategori"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <div className="loading-spinner" style={{
                                        width: '1em',
                                        height: '1em',
                                        borderWidth: '2px',
                                        marginBottom: 0,
                                        borderColor: 'var(--color-danger)',
                                        borderTopColor: 'transparent'
                                    }} />
                                ) : '🗑️'}
                            </button>
                        </div>
                    );
                })}
            </div>
            <form className="form-row" style={{ alignItems: 'flex-end' }} onSubmit={handleAdd}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" htmlFor="new-category-name">Ny kategori</label>
                    <input
                        id="new-category-name"
                        type="text"
                        className="form-input"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Kategorinamn"
                        disabled={isAdding}
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ height: 38, minWidth: 100 }}
                    disabled={isAdding || !newName.trim()}
                >
                    {isAdding ? (
                        <div className="loading-spinner" style={{
                            width: '1em',
                            height: '1em',
                            borderWidth: '2px',
                            marginBottom: 0,
                            borderColor: 'white',
                            borderTopColor: 'transparent'
                        }} />
                    ) : 'Lägg till'}
                </button>
            </form>
        </div>
    );
}
