/**
 * Stable categoryIds (UUID) + display names + colors — matches seeded Mongo documents.
 * Same logical set as `expenseCategoryValues` in shared (used for AI / validation fallbacks).
 */
export const PREDEFINED_CATEGORY_SEED: ReadonlyArray<{ categoryId: string; name: string; color: string }> = [
  { categoryId: "a1000000-0000-4000-8000-000000000001", name: "Food", color: "#2fb58d" },
  { categoryId: "a1000000-0000-4000-8000-000000000002", name: "Transport", color: "#4f8ff7" },
  { categoryId: "a1000000-0000-4000-8000-000000000003", name: "Housing", color: "#f0a060" },
  { categoryId: "a1000000-0000-4000-8000-000000000004", name: "Utilities", color: "#f4b03e" },
  { categoryId: "a1000000-0000-4000-8000-000000000005", name: "Entertainment", color: "#ef5a94" },
  { categoryId: "a1000000-0000-4000-8000-000000000006", name: "Health", color: "#4ade80" },
  { categoryId: "a1000000-0000-4000-8000-000000000007", name: "Shopping", color: "#e879f9" },
  { categoryId: "a1000000-0000-4000-8000-000000000008", name: "Travel", color: "#38bdf8" },
  { categoryId: "a1000000-0000-4000-8000-000000000009", name: "Education", color: "#818cf8" },
  { categoryId: "a1000000-0000-4000-8000-00000000000a", name: "Subscriptions", color: "#c084fc" },
  { categoryId: "a1000000-0000-4000-8000-00000000000b", name: "Other", color: "#8e8e87" },
];
