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

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(2).max(80),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const expenseInputSchema = z.object({
  amount: z.number().positive(),
  description: z.string().trim().min(1).max(120),
  category: expenseCategorySchema,
  date: isoDateSchema,
  aiParsed: z.boolean().default(false),
});

export const expenseSchema = expenseInputSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type Expense = z.infer<typeof expenseSchema>;

export const expenseFiltersSchema = z.object({
  category: z.string().trim().min(1).optional(),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
});

export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;

export const incomeSourcesSchema = z.object({
  salary: z.number().nonnegative().default(0),
  freelance: z.number().nonnegative().default(0),
  businessRevenue: z.number().nonnegative().default(0),
  passiveIncome: z.number().nonnegative().default(0),
});

export const plannedExpensesSchema = z.object({
  food: z.number().nonnegative().default(0),
  rent: z.number().nonnegative().default(0),
  transport: z.number().nonnegative().default(0),
  subscriptions: z.number().nonnegative().default(0),
  shopping: z.number().nonnegative().default(0),
});

export type IncomeSources = z.infer<typeof incomeSourcesSchema>;
export type PlannedExpenses = z.infer<typeof plannedExpensesSchema>;

export const budgetPlanInputSchema = z.object({
  monthlyIncome: z.number().nonnegative(),
  fixedCosts: z.number().nonnegative(),
  savingsTarget: z.number().nonnegative(),
  incomeSources: incomeSourcesSchema.default({
    salary: 0,
    freelance: 0,
    businessRevenue: 0,
    passiveIncome: 0,
  }),
  plannedExpenses: plannedExpensesSchema.default({
    food: 0,
    rent: 0,
    transport: 0,
    subscriptions: 0,
    shopping: 0,
  }),
  categoryLimits: z.record(z.string(), z.number().nonnegative()),
});

export const budgetPlanSchema = budgetPlanInputSchema.extend({
  id: z.string(),
  userId: z.string(),
  updatedAt: z.string(),
});

export type BudgetPlanInput = z.infer<typeof budgetPlanInputSchema>;
export type BudgetPlan = z.infer<typeof budgetPlanSchema>;

export const goalInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetAmount: z.number().positive(),
  targetDate: isoDateSchema,
});

export const goalProjectionSchema = z.object({
  monthlySavingsRate: z.number(),
  projectedEta: isoDateSchema.nullable(),
  isOnTrack: z.boolean(),
  shortfallAmount: z.number().nonnegative(),
  paceWindowDays: z.number().int().positive(),
});

export const goalSchema = goalInputSchema.extend({
  id: z.string(),
  userId: z.string(),
  currentAmount: z.number().nonnegative(),
  status: z.enum(["on_track", "at_risk", "achieved", "insufficient_data"]),
  aiEtaInsight: z.string().min(1),
  forecast: goalProjectionSchema,
  updatedAt: z.string(),
  createdAt: z.string(),
});

export type GoalInput = z.infer<typeof goalInputSchema>;
export type GoalProjection = z.infer<typeof goalProjectionSchema>;
export type Goal = z.infer<typeof goalSchema>;

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
