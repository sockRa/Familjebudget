import { MonthlyOverview, formatCurrency } from '../types';

interface SummaryCardsProps {
    overview: MonthlyOverview;
}

export function SummaryCards({ overview }: SummaryCardsProps) {
    return (
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
    );
}
