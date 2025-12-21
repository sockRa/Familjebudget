// Types for the budget application

export type Owner = 'jag' | 'fruga';

export type PaymentMethod =
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
}

export interface Expense {
    id: number;
    name: string;
    amount: number;
    category_id: number;
    expense_type: ExpenseType;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    year_month: number | null; // null for fixed, YYYYMM for variable
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
