import { z } from 'zod';

export const CategorySchema = z.object({
    name: z.string().min(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const IncomeSchema = z.object({
    name: z.string().min(1),
    owner: z.string().min(1),
    amount: z.number().nonnegative(),
    year_month: z.number(),
});

export const ExpenseSchema = z.object({
    name: z.string().min(1),
    amount: z.number().nonnegative(),
    category_id: z.number().nullable().optional(),
    expense_type: z.enum(['fixed', 'variable']),
    payment_method: z.string().min(1),
    payment_status: z.string().default('unpaid'),
    year_month: z.number().nullable().optional(),
});

export const ExpenseUpdateSchema = ExpenseSchema.partial();
