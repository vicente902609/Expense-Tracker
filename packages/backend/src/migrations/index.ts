import { initialSchemaMigration } from "./001-initial-schema.js";
import { userCustomCategoriesMigration } from "./002-user-custom-categories.js";
import { userCustomCategoryColorsMigration } from "./003-user-custom-category-colors.js";
import { userCustomCategoryDocsMigration } from "./004-user-custom-category-docs.js";

export const migrations = [
  initialSchemaMigration,
  userCustomCategoriesMigration,
  userCustomCategoryColorsMigration,
  userCustomCategoryDocsMigration,
];
