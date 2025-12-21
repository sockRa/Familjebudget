// Shared types between frontend and backend

export type Owner = 'jag' | 'fruga';

export type PaymentMethod =
    | 'efaktura'
    | 'efaktura_jag'
    | 'efaktura_fruga'
    | 'efaktura_gemensamt'
    | 'autogiro_jag'
    | 'autogiro_fruga'
    | 'autogiro_gemensamt';

export type ExpenseType = 'fixed' | 'variable';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid';

export interface Category {
    id: number;
    name: string;
}

export interface Income {
    id: number;
    name: string;
    owner: Owner;
    amount: number;
    year_month: number;
}

export interface Expense {
    id: number;
    name: string;
    amount: number;
    category_id: number | null;
    category_name?: string;
    expense_type: ExpenseType;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    year_month: number | null;
    overrides_expense_id: number | null;
    created_at: string;
}

export interface MonthlyOverview {
    yearMonth: number;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transferToJoint: {
        jag: number;
        fruga: number;
    };
    expensesByPaymentMethod: Record<PaymentMethod, number>;
    expensesByPerson: {
        jag: number;
        fruga: number;
        gemensamt: number;
    };
}

// Helper functions
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    efaktura: 'E-faktura',
    efaktura_jag: 'E-faktura (Jag)',
    efaktura_fruga: 'E-faktura (Fruga)',
    efaktura_gemensamt: 'E-faktura (Gemensamt)',
    autogiro_jag: 'Autogiro (Jag)',
    autogiro_fruga: 'Autogiro (Fruga)',
    autogiro_gemensamt: 'Autogiro (Gemensamt)',
};

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
    efaktura: '📄',
    efaktura_jag: '📄🔵',
    efaktura_fruga: '📄🟣',
    efaktura_gemensamt: '📄🟢',
    autogiro_jag: '🔵',
    autogiro_fruga: '🟣',
    autogiro_gemensamt: '🟢',
};

export const OWNER_LABELS: Record<Owner, string> = {
    jag: 'Jag',
    fruga: 'Fruga',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    unpaid: 'Ej betald',
    pending: 'Pågående',
    paid: 'Betald',
};

export const PAYMENT_STATUS_ICONS: Record<PaymentStatus, string> = {
    unpaid: '❌',
    pending: '⏳',
    paid: '✅',
};

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatYearMonth(yearMonth: number): string {
    const year = Math.floor(yearMonth / 100);
    const month = yearMonth % 100;
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
}

export function isCurrentMonth(yearMonth: number): boolean {
    return yearMonth === getCurrentYearMonth();
}

export function getCurrentYearMonth(): number {
    const now = new Date();
    return now.getFullYear() * 100 + (now.getMonth() + 1);
}

export function addMonths(yearMonth: number, months: number): number {
    const year = Math.floor(yearMonth / 100);
    const month = yearMonth % 100;
    const date = new Date(year, month - 1 + months);
    return date.getFullYear() * 100 + (date.getMonth() + 1);
}
