import { formatCurrency } from '../types';

interface TrendIndicatorProps {
    current: number;
    previous: number;
    label?: string;
    /** If true, lower is better (like expenses). If false, higher is better (like income) */
    lowerIsBetter?: boolean;
}

export function TrendIndicator({ current, previous, label, lowerIsBetter = false }: TrendIndicatorProps) {
    if (previous === 0) {
        return null; // Can't calculate trend without previous data
    }

    const diff = current - previous;
    const percentChange = ((diff / previous) * 100);
    const isPositive = diff > 0;

    // Determine if this change is "good" or "bad"
    const isGood = lowerIsBetter ? !isPositive : isPositive;

    // Construct accessible label
    const trendText = isPositive ? 'ökade' : 'minskade';
    const accessibleLabel = `${label || 'Trend'}: ${trendText} med ${Math.abs(percentChange).toFixed(0)}% från ${formatCurrency(previous)} till ${formatCurrency(current)}`;

    // Skip tiny changes
    if (Math.abs(percentChange) < 0.5) {
        return (
            <span
                className="trend-indicator neutral"
                title={`${label ? label + '\n' : ''}Oförändrat (${formatCurrency(previous)} → ${formatCurrency(current)})`}
                aria-label={`${label || 'Trend'}: Oförändrat (0%)`}
                role="img"
            >
                <span aria-hidden="true">→ 0%</span>
            </span>
        );
    }

    return (
        <span
            className={`trend-indicator ${isGood ? 'positive' : 'negative'}`}
            title={`${label ? label + '\n' : ''}${formatCurrency(previous)} → ${formatCurrency(current)} (${isPositive ? '+' : ''}${Math.abs(percentChange).toFixed(0)}%)`}
            aria-label={accessibleLabel}
            role="img"
        >
            <span aria-hidden="true">
                {isPositive ? '↑' : '↓'} {Math.abs(percentChange).toFixed(0)}%
            </span>
        </span>
    );
}

interface TrendComparisonProps {
    currentMonth: {
        totalExpenses: number;
        totalIncome: number;
        balance: number;
    };
    previousMonth: {
        totalExpenses: number;
        totalIncome: number;
        balance: number;
    } | null;
}

export function TrendComparison({ currentMonth, previousMonth }: TrendComparisonProps) {
    if (!previousMonth) {
        return null;
    }

    return (
        <div className="trend-comparison">
            <div className="trend-item">
                <span className="trend-label">Utgifter</span>
                <TrendIndicator
                    current={currentMonth.totalExpenses}
                    previous={previousMonth.totalExpenses}
                    label="Utgifter"
                    lowerIsBetter={true}
                />
            </div>
            <div className="trend-item">
                <span className="trend-label">Inkomster</span>
                <TrendIndicator
                    current={currentMonth.totalIncome}
                    previous={previousMonth.totalIncome}
                    label="Inkomster"
                    lowerIsBetter={false}
                />
            </div>
            <div className="trend-item">
                <span className="trend-label">Balans</span>
                <TrendIndicator
                    current={currentMonth.balance}
                    previous={previousMonth.balance}
                    label="Balans"
                    lowerIsBetter={false}
                />
            </div>
        </div>
    );
}
