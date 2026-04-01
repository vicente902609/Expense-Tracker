import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { ensureRefreshTokenIndexes } from "./modules/auth/refresh-token.repository.js";
import { ensurePredefinedCategoriesSeed } from "./modules/categories/predefined-categories.repository.js";
import { ensureExpenseIndexes, migrateLegacyExpenseCategoryIds } from "./modules/expenses/repository.js";

const app = createApp();

await ensurePredefinedCategoriesSeed();
await ensureExpenseIndexes();
await migrateLegacyExpenseCategoryIds();
await ensureRefreshTokenIndexes();

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
