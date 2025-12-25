import { z } from 'zod';

// Payment methods
export const PaymentMethodSchema = z.enum([
    'efaktura_jag',
    'efaktura_fruga',
    'autogiro_jag',
    'autogiro_fruga',
    'autogiro_gemensamt',
    'transfer',
]);

export const OwnerSchema = z.enum(['jag', 'fruga']);

export const ExpenseTypeSchema = z.enum(['fixed', 'variable']);

export const PaymentStatusSchema = z.enum(['unpaid', 'pending', 'paid']);

// Amount validation - accepts string from input and converts to number
const AmountSchema = z.string().transform((val, ctx) => {
    const trimmed = val.trim();
    if (trimmed === '') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Belopp krävs',
        });
        return z.NEVER;
    }
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Belopp måste vara ett giltigt tal',
        });
        return z.NEVER;
    }
    if (parsed < 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Belopp måste vara positivt',
        });
        return z.NEVER;
    }
    return parsed;
});

// Expense validation schema
export const ExpenseFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Namn krävs')
        .max(200, 'Namn får max vara 200 tecken')
        .transform((s: string) => s.trim()),
    amount: AmountSchema,
    category_id: z.number().int().nullable().optional(),
    expense_type: ExpenseTypeSchema,
    payment_method: PaymentMethodSchema,
    payment_status: PaymentStatusSchema.default('unpaid'),
    is_transfer: z.union([z.boolean(), z.number()]).transform((v) =>
        typeof v === 'boolean' ? (v ? 1 : 0) : v
    ).optional(),
});

// Income validation schema
export const IncomeFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Namn krävs')
        .max(100, 'Namn får max vara 100 tecken')
        .transform((s: string) => s.trim()),
    owner: OwnerSchema,
    amount: AmountSchema,
    year_month: z.number().int().min(190001).max(209912, 'Ogiltigt datum'),
});

// Category validation schema
export const CategoryFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Namn krävs')
        .max(100, 'Namn får max vara 100 tecken')
        .transform((s: string) => s.trim()),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Ogiltig färgkod').optional(),
});

// Type exports for use in components
export type ExpenseFormData = z.infer<typeof ExpenseFormSchema>;
export type IncomeFormData = z.infer<typeof IncomeFormSchema>;
export type CategoryFormData = z.infer<typeof CategoryFormSchema>;

// Validation helper function
export function validateForm<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) {
            errors[path] = issue.message;
        }
    }

    return { success: false, errors };
}
