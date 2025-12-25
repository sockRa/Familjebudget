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
                    <div className="stat-label">Balans</div>
                    <div className="stat-value">{formatCurrency(overview.balance)}</div>
                </div>
                {overview.totalTransfers > 0 && (
                    <div className="stat-card">
                        <div className="stat-label">Överföringar</div>
                        <div className="stat-value" style={{ color: 'var(--color-text-muted)' }}>
                            {formatCurrency(overview.totalTransfers)}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                {/* To Pay Card */}
                <div className="card">
                    <div className="section-header" style={{ borderBottomColor: 'var(--color-primary)', position: 'static' }}>
                        <span className="section-title">Kvar att betala (Räkningar)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
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

                {/* Liquidity Card */}
                <div className="card">
                    <div className="section-header" style={{ borderBottomColor: 'var(--color-warning)', position: 'static' }}>
                        <span className="section-title">Likviditetsbehov (Räkningar + Flytt)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
                        <div className="stat-small">
                            <span className="label blue">{settings.person1Name}</span>
                            <span className="value">{formatCurrency(overview.liquidityByPerson.jag)}</span>
                        </div>
                        <div className="stat-small">
                            <span className="label pink">{settings.person2Name}</span>
                            <span className="value">{formatCurrency(overview.liquidityByPerson.fruga)}</span>
                        </div>
                        <div className="stat-small">
                            <span className="label green">Gemensamt</span>
                            <span className="value">{formatCurrency(overview.liquidityByPerson.gemensamt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
