import { MonthlyOverview, formatCurrency } from '../types';

interface SummaryCardsProps {
    overview: MonthlyOverview;
    settings: {
        person1Name: string;
        person2Name: string;
    };
}

export function SummaryCards({ overview, settings }: SummaryCardsProps) {
    return (
        <>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Inkomster</div>
                    <div className="stat-value">{formatCurrency(overview.totalIncome)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Utgifter</div>
                    <div className="stat-value">{formatCurrency(overview.totalExpenses)}</div>
                </div>
                <div className={`stat-card ${overview.balance >= 0 ? 'positive' : 'negative'}`}>
                    <div className="stat-label">Kvar</div>
                    <div className="stat-value">{formatCurrency(overview.balance)}</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="section-header">
                    <span className="section-title">Kvar att betala per person</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)' }}>
                    <div className="stat-small">
                        <span className="label blue">{settings.person1Name}</span>
                        <span className="value">{formatCurrency(overview.expensesByPerson.jag)}</span>
                    </div>
                    <div className="stat-small">
                        <span className="label pink">{settings.person2Name}</span>
                        <span className="value">{formatCurrency(overview.expensesByPerson.fruga)}</span>
                    </div>
                    <div className="stat-small">
                        <span className="label green">Gemensamt</span>
                        <span className="value">{formatCurrency(overview.expensesByPerson.gemensamt)}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
