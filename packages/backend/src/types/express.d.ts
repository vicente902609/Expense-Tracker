import type { User } from "@expense-tracker/shared";

declare global {
  namespace Express {
    interface Request {
      authUser?: User;
    }
  }
}

export {};
