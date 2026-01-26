import { z } from 'zod';

// Strict type definitions matching shared types
export const OwnerSchema = z.enum(['jag', 'fruga']);

export const PaymentMethodSchema = z.enum([
    'efaktura_jag',
    'efaktura_fruga',
    'autogiro_jag',
    'autogiro_fruga',
    'autogiro_gemensamt',
    'transfer',
]);

export const ExpenseTypeSchema = z.enum(['fixed', 'variable']);

export const PaymentStatusSchema = z.enum(['unpaid', 'pending', 'paid']);

// Category schemas
export const CategorySchema = z.object({
    name: z.string().min(1, 'Namn krävs').max(100, 'Namn får max vara 100 tecken'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Ogiltig färgkod').optional(),
});

export const CategoryUpdateSchema = CategorySchema.partial();

// Income schemas
export const IncomeSchema = z.object({
    name: z.string().min(1, 'Namn krävs').max(100, 'Namn får max vara 100 tecken'),
    owner: OwnerSchema,
    amount: z.number().nonnegative('Belopp måste vara positivt'),
    year_month: z.number().int().min(190001).max(209912, 'Ogiltigt datum'),
});

export const IncomeUpdateSchema = IncomeSchema.partial();

// Expense schemas
export const ExpenseSchema = z.object({
    name: z.string().min(1, 'Namn krävs').max(200, 'Namn får max vara 200 tecken'),
    amount: z.number().nonnegative('Belopp måste vara positivt'),
    category_id: z.number().int().nullable().optional(),
    expense_type: ExpenseTypeSchema,
    payment_method: PaymentMethodSchema,
    payment_status: PaymentStatusSchema.default('unpaid'),
    year_month: z.number().int().min(190001).max(209912).nullable().optional(),
    is_transfer: z.boolean().or(z.number()).transform(v => typeof v === 'boolean' ? (v ? 1 : 0) : v).optional(),
});

export const ExpenseUpdateSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    amount: z.number().nonnegative().optional(),
    category_id: z.number().int().nullable().optional(),
    expense_type: ExpenseTypeSchema.optional(),
    payment_method: PaymentMethodSchema.optional(),
    payment_status: PaymentStatusSchema.optional(),
    year_month: z.number().int().min(190001).max(209912).nullable().optional(),
    is_transfer: z.boolean().or(z.number()).transform(v => typeof v === 'boolean' ? (v ? 1 : 0) : v).optional(),
});

// Query parameter schemas
export const YearMonthQuerySchema = z.object({
    year_month: z.string().regex(/^\d{6}$/).transform(Number).pipe(z.number().min(190001).max(209912)).optional(),
    yearMonth: z.string().regex(/^\d{6}$/).transform(Number).pipe(z.number().min(190001).max(209912)).optional(),
});

// ID parameter schema
export const IdParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Ogiltigt ID').transform(Number),
});

export const YearMonthParamSchema = z.object({
    yearMonth: z.string().regex(/^\d{6}$/, 'Använd format YYYYMM').transform(Number).pipe(z.number().min(190001, 'Datum måste vara mellan 1900-2099').max(209912, 'Datum måste vara mellan 1900-2099')),
});

// Settings schemas
export const SettingsSchema = z.object({
    person1Name: z.string().min(1).max(50).optional(),
    person2Name: z.string().min(1).max(50).optional(),
});
