import { useState, useEffect } from 'react';
import { Settings, MonthlyStats, formatCurrency, formatYearMonth, addMonths } from '../types';
import { statisticsApi } from '../api';

interface StatisticsPanelProps {
    currentMonth: number;
    settings: Settings;
}

export function StatisticsPanel({ currentMonth }: StatisticsPanelProps) {
    const [stats, setStats] = useState<MonthlyStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Get last 6 months of data
                const startMonth = addMonths(currentMonth, -5);
                const data = await statisticsApi.getMonthly(startMonth, currentMonth);
                setStats(data);
            } catch (err) {
                console.error('Failed to load statistics:', err);
                setError('Kunde inte ladda statistik');
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, [currentMonth]);

    if (isLoading) {
        return (
            <div className="card">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Laddar statistik...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (stats.length === 0) {
        return (
            <div className="card">
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <p>Ingen statistik tillgänglig ännu</p>
                </div>
            </div>
        );
    }

    // Calculate max value for chart scaling
    const maxExpense = Math.max(...stats.map(s => s.totalExpenses), 1);

    // Calculate totals
    const totalExpenses = stats.reduce((sum, s) => sum + s.totalExpenses, 0);
    const totalIncome = stats.reduce((sum, s) => sum + s.totalIncome, 0);
    const avgMonthly = totalExpenses / stats.length;

    // Category totals across all months
    const categoryTotals: Record<string, number> = {};
    stats.forEach(s => {
        Object.entries(s.byCategory || {}).forEach(([cat, amount]) => {
            categoryTotals[cat] = (categoryTotals[cat] || 0) + (amount as number);
        });
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="statistics-panel">
            {/* Summary cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Totala utgifter (6 mån)</div>
                    <div className="stat-value">{formatCurrency(totalExpenses)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Genomsnitt/månad</div>
                    <div className="stat-value">{formatCurrency(avgMonthly)}</div>
                </div>
                <div className="stat-card positive">
                    <div className="stat-label">Totala inkomster</div>
                    <div className="stat-value">{formatCurrency(totalIncome)}</div>
                </div>
            </div>

            {/* Bar chart */}
            <div className="card">
                <h3 className="section-title" style={{ marginBottom: 'var(--space-lg)' }}>
                    Utgifter per månad
                </h3>
                <div className="simple-bar-chart">
                    {stats.map(s => (
                        <div key={s.yearMonth} className="bar-item">
                            <div className="bar-container">
                                <div
                                    className="bar-fill"
                                    style={{
                                        height: `${(s.totalExpenses / maxExpense) * 100}%`,
                                    }}
                                >
                                    <span className="bar-value">{formatCurrency(s.totalExpenses)}</span>
                                </div>
                            </div>
                            <div className="bar-label">
                                {formatYearMonth(s.yearMonth).split(' ')[0].slice(0, 3)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top categories */}
            {sortedCategories.length > 0 && (
                <div className="card">
                    <h3 className="section-title" style={{ marginBottom: 'var(--space-lg)' }}>
                        Topp 5 kategorier
                    </h3>
                    <div className="category-breakdown">
                        {sortedCategories.map(([category, amount]) => {
                            const percentage = (amount / totalExpenses) * 100;
                            return (
                                <div key={category} className="category-row">
                                    <div className="category-info">
                                        <span className="category-name">{category || 'Okategoriserat'}</span>
                                        <span className="category-amount">{formatCurrency(amount)}</span>
                                    </div>
                                    <div className="category-bar-bg">
                                        <div
                                            className="category-bar-fill"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="category-percent">{percentage.toFixed(1)}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
