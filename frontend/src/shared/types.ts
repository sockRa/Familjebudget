// AUTO-GENERATED: Do not edit directly. Edit shared/ instead.
// Run 'npm run sync-types' from project root to regenerate.

// Shared types between frontend and backend

export type Owner = 'jag' | 'fruga';

export type PaymentMethod =
    | 'efaktura_jag'
    | 'efaktura_fruga'
    | 'autogiro_jag'
    | 'autogiro_fruga'
    | 'autogiro_gemensamt'
    | 'transfer';

export type ExpenseType = 'fixed' | 'variable';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid';

export interface Category {
    id: number;
    name: string;
    color?: string;
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
    is_deleted?: number;
    is_transfer?: number;
    created_at: string;
}

export interface Settings {
    person1Name: string;
    person2Name: string;
}

export interface MonthlyOverview {
    yearMonth: number;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    unbudgeted: number;
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
    totalTransfers: number;
    liquidityByPerson: {
        jag: number;
        fruga: number;
        gemensamt: number;
    };
}

export interface MonthlyStats {
    yearMonth: number;
    totalExpenses: number;
    totalIncome: number;
    byCategory: Record<string, number>;
    byPaymentMethod: Record<PaymentMethod, number>;
}

// Constants
export const DEFAULT_SETTINGS: Settings = {
    person1Name: 'Person 1',
    person2Name: 'Person 2',
};

export const PAYMENT_METHODS: PaymentMethod[] = [
    'efaktura_jag',
    'efaktura_fruga',
    'autogiro_jag',
    'autogiro_fruga',
    'autogiro_gemensamt',
    'transfer',
];

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

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
    efaktura_jag: '📄🔵',
    efaktura_fruga: '📄🟣',
    autogiro_jag: '🔵',
    autogiro_fruga: '🟣',
    autogiro_gemensamt: '🟢',
    transfer: '🔄',
};

// Helper functions
export function getPaymentMethodLabel(
    method: PaymentMethod,
    settings: { person1Name: string; person2Name: string }
): string {
    const labels: Record<PaymentMethod, string> = {
        efaktura_jag: `E-faktura (${settings.person1Name})`,
        efaktura_fruga: `E-faktura (${settings.person2Name})`,
        autogiro_jag: `Autogiro (${settings.person1Name})`,
        autogiro_fruga: `Autogiro (${settings.person2Name})`,
        autogiro_gemensamt: 'Autogiro (Gemensamt)',
        transfer: 'Överföring',
    };
    return labels[method] || method;
}

export function getOwnerLabel(
    owner: Owner,
    settings: { person1Name: string; person2Name: string }
): string {
    return owner === 'jag' ? settings.person1Name : settings.person2Name;
}

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

export function isCurrentMonth(yearMonth: number): boolean {
    return yearMonth === getCurrentYearMonth();
}
