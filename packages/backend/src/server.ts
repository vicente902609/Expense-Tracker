import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { ensureRefreshTokenIndexes } from "./modules/auth/refresh-token.repository.js";

const app = createApp();

await ensureRefreshTokenIndexes();

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
