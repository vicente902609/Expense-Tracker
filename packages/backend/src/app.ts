import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { authenticate } from "./middleware/authenticate.js";
import { errorHandler } from "./middleware/error-handler.js";
import { aiRouter } from "./modules/ai/routes.js";
import { authRouter } from "./modules/auth/routes.js";
import { categoriesRouter } from "./modules/categories/routes.js";
import { expensesRouter } from "./modules/expenses/routes.js";
import { goalsRouter } from "./modules/goals/routes.js";
import { reportsRouter } from "./modules/reports/routes.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
    }),
  );
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Mount the same API twice so one `VITE_API_BASE_URL` works for:
   * - Serverless (HTTP API): `https://...amazonaws.com/dev` → `/auth/login`, `/categories`, …
   * - Legacy Express: `http://localhost:4000/api/v1` → `/api/v1/auth/login`, …
   */
  const mountProtectedApi = (base: string) => {
    app.use(`${base}/expenses`, authenticate, expensesRouter);
    app.use(`${base}/goals`, authenticate, goalsRouter);
    app.use(`${base}/categories`, authenticate, categoriesRouter);
    app.use(`${base}/ai`, authenticate, aiRouter);
    app.use(`${base}/reports`, authenticate, reportsRouter);
  };

  app.use("/api/v1/auth", authRouter);
  app.use("/auth", authRouter);
  mountProtectedApi("/api/v1");
  mountProtectedApi("");

  app.use(errorHandler);

  return app;
};
