import type { Migration } from "./types.js";

export const userCustomCategoriesMigration: Migration = {
  id: "002-user-custom-categories",
  description: "Add customCategories array to user documents for persisted category management",
  up: async (database) => {
    await database.collection("users").updateMany({ customCategories: { $exists: false } }, { $set: { customCategories: [] } });
  },
};
