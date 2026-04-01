import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { ensureRefreshTokenIndexes } from "./modules/auth/refresh-token.repository.js";
import { ensurePredefinedCategoriesSeed } from "./modules/categories/predefined-categories.repository.js";

const app = createApp();

await ensurePredefinedCategoriesSeed();
await ensureRefreshTokenIndexes();

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
