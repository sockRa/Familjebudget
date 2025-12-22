import type { Category, Income, Expense, MonthlyOverview, Settings, MonthlyStats } from './types';

const API_BASE = '/api';

// Custom error class with structured details
export class ApiError extends Error {
    status: number;
    details?: Array<{ path: string; message: string }>;

    constructor(message: string, status: number, details?: Array<{ path: string; message: string }>) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }

    getDetailedMessage(): string {
        if (this.details && this.details.length > 0) {
            return this.details.map(d => `${d.path}: ${d.message}`).join('\n');
        }
        return this.message;
    }
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(API_BASE + url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Nätverksfel' }));
        throw new ApiError(
            errorData.error || 'Förfrågan misslyckades',
            response.status,
            errorData.details
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

// Categories
export const categoriesApi = {
    getAll: () => fetchJSON<Category[]>('/categories'),
    create: (data: { name: string; color?: string }) =>
        fetchJSON<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; color?: string }) =>
        fetchJSON<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
        fetchJSON<void>(`/categories/${id}`, { method: 'DELETE' }),
};

// Incomes
export const incomesApi = {
    getAll: (yearMonth?: number) =>
        fetchJSON<Income[]>(`/incomes${yearMonth ? `?yearMonth=${yearMonth}` : ''}`),
    create: (data: { name: string; owner: string; amount: number; year_month: number }) =>
        fetchJSON<Income>('/incomes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; owner?: string; amount?: number; year_month?: number }) =>
        fetchJSON<Income>(`/incomes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
        fetchJSON<void>(`/incomes/${id}`, { method: 'DELETE' }),
};

// Expenses
export const expensesApi = {
    getAll: (yearMonth?: number) =>
        fetchJSON<Expense[]>(`/expenses${yearMonth ? `?year_month=${yearMonth}` : ''}`),
    create: (data: {
        name: string;
        amount: number;
        category_id?: number;
        expense_type: string;
        payment_method: string;
        year_month?: number;
    }) =>
        fetchJSON<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Expense>) =>
        fetchJSON<Expense>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
        fetchJSON<void>(`/expenses/${id}`, { method: 'DELETE' }),
    createOverride: (id: number, yearMonth: number, data: Partial<Expense>) =>
        fetchJSON<Expense>(`/expenses/${id}/override`, {
            method: 'POST',
            body: JSON.stringify({ ...data, year_month: yearMonth })
        }),
    hideForMonth: (id: number, yearMonth: number) =>
        fetchJSON<Expense>(`/expenses/${id}/hide/${yearMonth}`, { method: 'POST' }),
};

// Overview
export const overviewApi = {
    get: (yearMonth: number) =>
        fetchJSON<MonthlyOverview>(`/overview/${yearMonth}`),
    getMonths: () =>
        fetchJSON<number[]>('/overview'),
};

// Settings
export const settingsApi = {
    get: () => fetchJSON<Settings>('/settings'),
    update: (data: Partial<Settings>) =>
        fetchJSON<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// Statistics
export const statisticsApi = {
    getMonthly: (startMonth: number, endMonth: number) =>
        fetchJSON<MonthlyStats[]>(`/statistics/monthly?start=${startMonth}&end=${endMonth}`),
};
