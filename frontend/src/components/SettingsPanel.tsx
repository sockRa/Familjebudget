import { useState } from 'react';

interface Settings {
    person1Name: string;
    person2Name: string;
    splitRatio: number;
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
    const [splitRatio, setSplitRatio] = useState((settings.splitRatio * 100).toString());

    const handleSave = () => {
        onSave({
            person1Name,
            person2Name,
            splitRatio: parseFloat(splitRatio) / 100,
        });
    };

    return (
        <div className="card">
            <div className="section-header">
                <span className="section-title">Inställningar</span>
            </div>
            <div className="form-group">
                <label className="form-label">Person 1 (visas som "Jag" i systemet)</label>
                <input
                    type="text"
                    className="form-input"
                    value={person1Name}
                    onChange={e => setPerson1Name(e.target.value)}
                    placeholder="Ditt namn"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Person 2 (visas som "Fruga" i systemet)</label>
                <input
                    type="text"
                    className="form-input"
                    value={person2Name}
                    onChange={e => setPerson2Name(e.target.value)}
                    placeholder="Partners namn"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Fördelning till gemensamt konto (%)</label>
                <div className="form-row">
                    <input
                        type="number"
                        className="form-input"
                        value={splitRatio}
                        onChange={e => setSplitRatio(e.target.value)}
                        min="0"
                        max="100"
                        placeholder="50"
                    />
                    <span style={{
                        alignSelf: 'center',
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap'
                    }}>
                        {person1Name}: {splitRatio}% / {person2Name}: {100 - parseFloat(splitRatio || '50')}%
                    </span>
                </div>
            </div>
            <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 'var(--space-md)' }}>
                Spara inställningar
            </button>
        </div>
    );
}
