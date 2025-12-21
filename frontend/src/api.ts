const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(API_BASE + url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

// Categories
export const categoriesApi = {
    getAll: () => fetchJSON<import('./types').Category[]>('/categories'),
    create: (data: { name: string; color?: string }) =>
        fetchJSON<import('./types').Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; color?: string }) =>
        fetchJSON<import('./types').Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
        fetchJSON<void>(`/categories/${id}`, { method: 'DELETE' }),
};

// Incomes
export const incomesApi = {
    getAll: (yearMonth?: number) =>
        fetchJSON<import('./types').Income[]>(`/incomes${yearMonth ? `?yearMonth=${yearMonth}` : ''}`),
    create: (data: { name: string; owner: string; amount: number; income_type: string; year_month?: number }) =>
        fetchJSON<import('./types').Income>('/incomes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; owner?: string; amount?: number; income_type?: string; year_month?: number | null }) =>
        fetchJSON<import('./types').Income>(`/incomes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
        fetchJSON<void>(`/incomes/${id}`, { method: 'DELETE' }),
};

// Expenses
export const expensesApi = {
    getAll: (yearMonth?: number) =>
        fetchJSON<import('./types').Expense[]>(`/expenses${yearMonth ? `?year_month=${yearMonth}` : ''}`),
    create: (data: {
        name: string;
        amount: number;
        category_id?: number;
        expense_type: string;
        payment_method: string;
        year_month?: number;
    }) =>
        fetchJSON<import('./types').Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<import('./types').Expense>) =>
        fetchJSON<import('./types').Expense>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
        fetchJSON<void>(`/expenses/${id}`, { method: 'DELETE' }),
};

// Overview
export const overviewApi = {
    get: (yearMonth: number) =>
        fetchJSON<import('./types').MonthlyOverview>(`/overview/${yearMonth}`),
    getMonths: () =>
        fetchJSON<number[]>('/overview'),
};
