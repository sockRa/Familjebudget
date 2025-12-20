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
    const [newColor, setNewColor] = useState('#6366f1');

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            await categoriesApi.create({ name: newName, color: newColor });
            setNewName('');
            onUpdate();
        } catch (err) {
            console.error('Failed to add category:', err);
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
                    <div key={cat.id} className="expense-item" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: cat.color
                            }}
                        />
                        <span className="expense-name">{cat.name}</span>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(cat.id)}>🗑️</button>
                    </div>
                ))}
            </div>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Ny kategori</label>
                    <input
                        type="text"
                        className="form-input"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Kategorinamn"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Färg</label>
                    <input
                        type="color"
                        value={newColor}
                        onChange={e => setNewColor(e.target.value)}
                        style={{ width: 50, height: 38, border: 'none', cursor: 'pointer' }}
                    />
                </div>
                <button className="btn btn-primary" onClick={handleAdd} style={{ height: 38 }}>
                    Lägg till
                </button>
            </div>
        </div>
    );
}
