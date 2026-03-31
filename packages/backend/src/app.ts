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

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/expenses", authenticate, expensesRouter);
  app.use("/api/v1/goals", authenticate, goalsRouter);
  app.use("/api/v1/categories", authenticate, categoriesRouter);
  app.use("/api/v1/ai", authenticate, aiRouter);

  app.use(errorHandler);

  return app;
};
