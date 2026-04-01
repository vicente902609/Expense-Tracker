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

/**
 * Map AI output or free text to a canonical predefined category. Use when the model
 * returns a synonym or unknown label — defaults to "Other".
 */
export const resolveExpenseCategory = (raw: string | null | undefined): PredefinedExpenseCategory => {
  if (raw == null) {
    return "Other";
  }

  const trimmed = String(raw).trim();

  if (!trimmed) {
    return "Other";
  }

  const exact = expenseCategoryValues.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) {
    return exact;
  }

  const rules: Array<{ re: RegExp; category: PredefinedExpenseCategory }> = [
    { re: /food|grocer|restaurant|meal|coffee|lunch|dinner|dining|cafe|breakfast|snack/iu, category: "Food" },
    { re: /transport|uber|lyft|taxi|bus|train|metro|subway|gas|fuel|parking|toll|commute|transit|vehicle/iu, category: "Transport" },
    { re: /housing|rent|mortgage|lease|apartment|landlord|hoa/iu, category: "Housing" },
    { re: /utilit|electric|water bill|internet|phone bill|power|cable|wifi/iu, category: "Utilities" },
    { re: /entertain|movie|concert|netflix|spotify|game|hobby|streaming|music|show/iu, category: "Entertainment" },
    { re: /health|medical|doctor|pharmacy|gym|fitness|hospital|dental|wellness|clinic/iu, category: "Health" },
    { re: /shop|amazon|retail|clothes|clothing|store|merch/iu, category: "Shopping" },
    { re: /travel|flight|hotel|airbnb|vacation|trip|luggage/iu, category: "Travel" },
    { re: /education|school|tuition|course|book|student|university|college|class/iu, category: "Education" },
    { re: /subscription|saas|software|membership|monthly plan|annual fee/iu, category: "Subscriptions" },
  ];

  for (const { re, category } of rules) {
    if (re.test(trimmed)) {
      return category;
    }
  }

  return "Other";
};

/**
 * Built-in categories first, then custom names (sorted, case-insensitive deduped).
 * Use for AI prompts and post-parse normalization.
 */
export const mergeExpenseCategoryAllowlist = (custom: readonly string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const c of expenseCategoryValues) {
    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }

  const sortedCustom = [...custom]
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
    .sort((left, right) => left.localeCompare(right));

  for (const c of sortedCustom) {
    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }

  return out;
};

/**
 * Build ordered allowlist from DB-backed predefined names plus user custom names (deduped case-insensitively).
 */
export const buildExpenseCategoryAllowlist = (predefined: readonly string[], custom: readonly string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of predefined) {
    const c = raw.trim();
    if (!c) {
      continue;
    }

    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }

  for (const raw of custom) {
    const c = raw.trim();
    if (!c) {
      continue;
    }

    const key = c.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }

  return out;
};

/**
 * Map AI / fallback output to a single allowed category label (predefined or custom).
 * Prefer exact label match, then synonym rules for built-ins, then "Other".
 */
export const resolveParsedExpenseCategory = (raw: string | null | undefined, allowedCategories: readonly string[]): string => {
  if (raw == null) {
    return "Other";
  }

  const trimmed = String(raw).trim();

  if (!trimmed) {
    return "Other";
  }

  const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

  const exact = allowedCategories.find((c) => normalize(c) === normalize(trimmed));
  if (exact) {
    return exact;
  }

  const predefined = resolveExpenseCategory(trimmed);
  if (predefined !== "Other") {
    return predefined;
  }

  return "Other";
};

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

/** Aligns with serverless auth handlers (register). */
export const registerBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

/** Aligns with serverless auth handlers (login). */
export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

/** API user shape (matches serverless auth responses; use `userId` not `id`). */
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

export const customCategoryNameSchema = z.string().trim().min(1).max(50);

/** Hex color #RRGGBB for category chips and charts. */
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

/** @deprecated Use `categoriesListResponseSchema` (GET /categories returns predefined + custom). */
export const categoriesResponseSchema = z.object({
  custom: z.array(customCategoryEntrySchema),
});

export type CategoriesResponse = z.infer<typeof categoriesResponseSchema>;

export const addCustomCategorySchema = z.object({
  name: customCategoryNameSchema,
  color: categoryHexColorSchema.optional(),
});

export const updateCustomCategoryBodySchema = z
  .object({
    name: customCategoryNameSchema.optional(),
    color: z.union([categoryHexColorSchema, z.null()]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.name === undefined && data.color === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one of name or color.",
      });
    }
  });

export type UpdateCustomCategoryBody = z.infer<typeof updateCustomCategoryBodySchema>;

export type AddCustomCategoryInput = z.infer<typeof addCustomCategorySchema>;

export const goalInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetAmount: z.number().positive(),
  targetDate: isoDateSchema.optional(),
  savedAmount: z.number().nonnegative().optional(),
  targetExpense: z.number().nonnegative(),
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
