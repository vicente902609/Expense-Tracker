import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { ensureRefreshTokenIndexes } from "./modules/auth/refresh-token.repository.js";
import { ensurePredefinedCategoriesSeed } from "./modules/categories/predefined-categories.repository.js";
import { ensureExpenseIndexes, migrateLegacyExpenseCategoryIds } from "./modules/expenses/repository.js";
import { ensureGoalIndexes } from "./modules/goals/repository.js";

const app = createApp();

await ensurePredefinedCategoriesSeed();
await ensureGoalIndexes();
await ensureExpenseIndexes();
await migrateLegacyExpenseCategoryIds();
await ensureRefreshTokenIndexes();

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
