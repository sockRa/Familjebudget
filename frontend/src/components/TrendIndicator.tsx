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

    // Skip tiny changes
    if (Math.abs(percentChange) < 0.5) {
        return (
            <span className="trend-indicator neutral" title={label}>
                → 0%
            </span>
        );
    }

    return (
        <span
            className={`trend-indicator ${isGood ? 'positive' : 'negative'}`}
            title={`${label ? label + ': ' : ''}${formatCurrency(previous)} → ${formatCurrency(current)}`}
        >
            {isPositive ? '↑' : '↓'} {Math.abs(percentChange).toFixed(0)}%
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
                    label="Jämfört med förra månaden"
                    lowerIsBetter={true}
                />
            </div>
            <div className="trend-item">
                <span className="trend-label">Inkomster</span>
                <TrendIndicator
                    current={currentMonth.totalIncome}
                    previous={previousMonth.totalIncome}
                    label="Jämfört med förra månaden"
                    lowerIsBetter={false}
                />
            </div>
            <div className="trend-item">
                <span className="trend-label">Balans</span>
                <TrendIndicator
                    current={currentMonth.balance}
                    previous={previousMonth.balance}
                    label="Jämfört med förra månaden"
                    lowerIsBetter={false}
                />
            </div>
        </div>
    );
}
