import { expenseCategoryValues, type PredefinedExpenseCategory } from "@/types";

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
