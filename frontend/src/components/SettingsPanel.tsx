import { useState } from 'react';

interface Settings {
    person1Name: string;
    person2Name: string;
}

interface SettingsPanelProps {
    settings: Settings;
    onSave: (s: Settings) => void;
}

export function SettingsPanel({
    settings,
    onSave
}: SettingsPanelProps) {
    const [person1Name, setPerson1Name] = useState(settings.person1Name);
    const [person2Name, setPerson2Name] = useState(settings.person2Name);
    const handleSave = () => {
        onSave({
            person1Name,
            person2Name,
        });
    };

    return (
        <div className="card">
            <div className="section-header">
                <span className="section-title">Inställningar</span>
            </div>
            <div className="form-group">
                <label className="form-label">Namn person 1</label>
                <input
                    type="text"
                    className="form-input"
                    value={person1Name}
                    onChange={e => setPerson1Name(e.target.value)}
                    placeholder="Ditt namn"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Namn person 2</label>
                <input
                    type="text"
                    className="form-input"
                    value={person2Name}
                    onChange={e => setPerson2Name(e.target.value)}
                    placeholder="Partners namn"
                />
            </div>
            <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 'var(--space-md)' }}>
                Spara inställningar
            </button>
        </div>
    );
}
