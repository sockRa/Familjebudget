import { memo } from 'react';
import { MonthlyOverview, formatCurrency } from '../types';
import { TrendIndicator } from './TrendIndicator';

interface SummaryCardsProps {
    overview: MonthlyOverview;
    previousOverview?: MonthlyOverview | null;
    settings: {
        person1Name: string;
        person2Name: string;
    };
}

// Memoized to prevent re-renders when parent state (like filters/list expansion) changes
export const SummaryCards = memo(function SummaryCards({ overview, previousOverview, settings }: SummaryCardsProps) {
    return (
        <>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Inkomster</div>
                    <div className="stat-value">
                        {formatCurrency(overview.totalIncome)}
                        {previousOverview && (
                            <TrendIndicator
                                current={overview.totalIncome}
                                previous={previousOverview.totalIncome}
                                label="Inkomster"
                                lowerIsBetter={false}
                            />
                        )}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Utgifter</div>
                    <div className="stat-value">
                        {formatCurrency(overview.totalExpenses)}
                        {previousOverview && (
                            <TrendIndicator
                                current={overview.totalExpenses}
                                previous={previousOverview.totalExpenses}
                                label="Utgifter"
                                lowerIsBetter={true}
                            />
                        )}
                    </div>
                </div>
                <div className={`stat-card ${overview.balance >= 0 ? 'positive' : 'negative'}`} title="Inkomster minus alla utgifter">
                    <div className="stat-label">Balans</div>
                    <div className="stat-value">
                        {formatCurrency(overview.balance)}
                        {previousOverview && (
                            <TrendIndicator
                                current={overview.balance}
                                previous={previousOverview.balance}
                                label="Balans"
                                lowerIsBetter={false}
                            />
                        )}
                    </div>
                </div>
                <div className={`stat-card ${overview.unbudgeted >= 0 ? 'positive' : 'negative'}`}>
                    <div className="stat-label">Obudgeterat</div>
                    <div className="stat-value">
                        {formatCurrency(overview.unbudgeted)}
                        {previousOverview && (
                            <TrendIndicator
                                current={overview.unbudgeted}
                                previous={previousOverview.unbudgeted}
                                label="Obudgeterat"
                                lowerIsBetter={false}
                            />
                        )}
                    </div>
                </div>
                {overview.totalTransfers > 0 && (
                    <div className="stat-card" title="Summa av alla rader markerade som överföring till sparkonto eller gemensamt konto">
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
});
