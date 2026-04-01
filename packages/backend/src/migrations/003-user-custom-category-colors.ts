import type { Migration } from "./types.js";

export const userCustomCategoryColorsMigration: Migration = {
  id: "003-user-custom-category-colors",
  description: "Add customCategoryColors map for optional per-category hex colors",
  up: async (database) => {
    await database.collection("users").updateMany({ customCategoryColors: { $exists: false } }, { $set: { customCategoryColors: {} } });
  },
};
