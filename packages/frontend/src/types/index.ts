import { z } from "zod";

export const expenseCategoryValues = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Travel",
  "Education",
  "Subscriptions",
  "Other",
] as const;

export type ExpenseCategory = (typeof expenseCategoryValues)[number] | string;

export type PredefinedExpenseCategory = (typeof expenseCategoryValues)[number];

export const expenseCategorySchema = z.union([
  z.enum(expenseCategoryValues),
  z.string().trim().min(1).max(50),
]);

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "Expected YYYY-MM-DD");

export const authPayloadSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(2).max(80).optional(),
});

export type AuthPayload = z.infer<typeof authPayloadSchema>;

export const registerBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const publicUserSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthTokens = z.infer<typeof authTokensSchema>;

export const authSessionDataSchema = z.object({
  user: publicUserSchema,
  tokens: authTokensSchema,
});

export type AuthSessionData = z.infer<typeof authSessionDataSchema>;

export const refreshTokensDataSchema = z.object({
  tokens: authTokensSchema,
});

export type RefreshTokensData = z.infer<typeof refreshTokensDataSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const logoutRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LogoutRequest = z.infer<typeof logoutRequestSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(2).max(80),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const expenseApiSchema = z.object({
  expenseId: z.string(),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1),
  date: isoDateSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Expense = z.infer<typeof expenseApiSchema>;

export const createExpenseBodySchema = z.object({
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1),
  date: isoDateSchema,
});

export type CreateExpenseBody = z.infer<typeof createExpenseBodySchema>;

export const updateExpenseBodySchema = z
  .object({
    amount: z.number().positive().optional(),
    description: z.string().max(500).optional(),
    categoryId: z.string().min(1).optional(),
    date: isoDateSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateExpenseBody = z.infer<typeof updateExpenseBodySchema>;

export const listExpensesQuerySchema = z.object({
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
  categoryId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

export const listExpensesResponseSchema = z.object({
  expenses: z.array(expenseApiSchema),
  nextCursor: z.string().optional(),
  totalCount: z.number().int().nonnegative(),
  totalAmount: z.number().nonnegative(),
});

export type ListExpensesResponse = z.infer<typeof listExpensesResponseSchema>;

export const reportsRangeQuerySchema = z.object({
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
});

export type ReportsRangeQuery = z.infer<typeof reportsRangeQuerySchema>;

export const monthlyReportRowSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/u),
  total: z.number(),
  count: z.number().int().nonnegative(),
});

export const monthlyReportResponseSchema = z.object({
  months: z.array(monthlyReportRowSchema),
});

export type MonthlyReportResponse = z.infer<typeof monthlyReportResponseSchema>;

export const byCategoryReportRowSchema = z.object({
  categoryId: z.string(),
  total: z.number(),
  count: z.number().int().nonnegative(),
});

export const byCategoryReportResponseSchema = z.object({
  categories: z.array(byCategoryReportRowSchema),
});

export type ByCategoryReportResponse = z.infer<typeof byCategoryReportResponseSchema>;

export const customCategoryNameSchema = z.string().trim().min(1).max(50);

export const categoryHexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/u, "Expected #RRGGBB");

/** @deprecated Legacy list-only shape; use `categoriesListResponseSchema`. */
export const customCategoryEntrySchema = z.object({
  name: z.string(),
  color: categoryHexColorSchema.optional(),
});

export type CustomCategoryEntry = z.infer<typeof customCategoryEntrySchema>;

export const predefinedCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  color: categoryHexColorSchema,
});

export type PredefinedCategory = z.infer<typeof predefinedCategorySchema>;

export const customCategoryApiSchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  color: categoryHexColorSchema,
  createdAt: z.string(),
});

export type CustomCategoryApi = z.infer<typeof customCategoryApiSchema>;

export const categoriesListResponseSchema = z.object({
  predefined: z.array(predefinedCategorySchema),
  custom: z.array(customCategoryApiSchema),
});

export type CategoriesListResponse = z.infer<typeof categoriesListResponseSchema>;

/** @deprecated Use `categoriesListResponseSchema`. */
export const categoriesResponseSchema = z.object({
  custom: z.array(customCategoryEntrySchema),
});

export type CategoriesResponse = z.infer<typeof categoriesResponseSchema>;

export const addCustomCategorySchema = z.object({
  name: customCategoryNameSchema,
  color: categoryHexColorSchema,
});

export const putCustomCategoryBodySchema = addCustomCategorySchema;
export type PutCustomCategoryBody = z.infer<typeof putCustomCategoryBodySchema>;

export type AddCustomCategoryInput = z.infer<typeof addCustomCategorySchema>;

export const goalCreateBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetExpense: z.number().positive(),
});

export const goalUpdateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    targetExpense: z.number().positive().optional(),
  })
  .refine((data) => data.name !== undefined || data.targetExpense !== undefined, {
    message: "At least one field (name or targetExpense) must be provided",
  });

export const goalSchema = z.object({
  name: z.string(),
  targetExpense: z.number().positive(),
  insight: z.string(),
  insightUpdatedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GoalCreateBody = z.infer<typeof goalCreateBodySchema>;
export type GoalUpdateBody = z.infer<typeof goalUpdateBodySchema>;
export type Goal = z.infer<typeof goalSchema>;

/** @deprecated Use `goalCreateBodySchema` / `goalUpdateBodySchema`. */
export const goalInputSchema = goalCreateBodySchema;
/** @deprecated Use `GoalCreateBody`. */
export type GoalInput = GoalCreateBody;

export const parseExpenseRequestSchema = z.object({
  text: z.string().trim().min(3).max(500),
  timezone: z.string().trim().min(1).default("UTC"),
  referenceDate: isoDateSchema.optional(),
});

export const parsedExpenseSchema = z.object({
  amount: z.number().positive().nullable(),
  description: z.string().trim().min(1).max(120).nullable(),
  category: expenseCategorySchema.nullable(),
  date: isoDateSchema.nullable(),
  confidence: z.number().min(0).max(1),
  notes: z.array(z.string()),
});

export type ParseExpenseRequest = z.infer<typeof parseExpenseRequestSchema>;
export type ParsedExpense = z.infer<typeof parsedExpenseSchema>;

/** @deprecated Legacy single JWT response; prefer AuthSessionData + API envelope. */
export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export const dashboardSummarySchema = z.object({
  monthSpendTotal: z.number().nonnegative(),
  categoryTotals: z.array(
    z.object({
      category: z.string(),
      total: z.number().nonnegative(),
    }),
  ),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
