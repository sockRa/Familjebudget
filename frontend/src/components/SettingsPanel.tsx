import { useState } from 'react';

interface Settings {
    person1Name: string;
    person2Name: string;
}

interface SettingsPanelProps {
    settings: Settings;
    onSave: (s: Settings) => Promise<void> | void;
}

export function SettingsPanel({
    settings,
    onSave
}: SettingsPanelProps) {
    const [person1Name, setPerson1Name] = useState(settings.person1Name);
    const [person2Name, setPerson2Name] = useState(settings.person2Name);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaved(false);
        try {
            await onSave({
                person1Name,
                person2Name,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save settings', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card">
            <div className="section-header">
                <span className="section-title">Inställningar</span>
            </div>
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label className="form-label" htmlFor="person1Name">Namn person 1</label>
                    <input
                        id="person1Name"
                        type="text"
                        className="form-input"
                        value={person1Name}
                        onChange={e => setPerson1Name(e.target.value)}
                        placeholder="Ditt namn"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="person2Name">Namn person 2</label>
                    <input
                        id="person2Name"
                        type="text"
                        className="form-input"
                        value={person2Name}
                        onChange={e => setPerson2Name(e.target.value)}
                        placeholder="Partners namn"
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                        marginTop: 'var(--space-md)',
                        minWidth: '160px',
                        backgroundColor: saved ? 'var(--color-success)' : undefined,
                        borderColor: saved ? 'var(--color-success)' : undefined
                    }}
                    disabled={isSaving}
                    aria-label={isSaving ? 'Sparar inställningar...' : 'Spara inställningar'}
                >
                    {isSaving ? (
                        <div className="loading-spinner" style={{
                            width: '1em',
                            height: '1em',
                            borderWidth: '2px',
                            marginBottom: 0,
                            borderColor: 'white',
                            borderTopColor: 'transparent',
                            display: 'inline-block'
                        }} />
                    ) : saved ? (
                        'Sparat! ✅'
                    ) : (
                        'Spara inställningar'
                    )}
                </button>
            </form>
        </div>
    );
}
