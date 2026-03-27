import { initialSchemaMigration } from "./001-initial-schema.js";
import { userCustomCategoriesMigration } from "./002-user-custom-categories.js";

export const migrations = [initialSchemaMigration, userCustomCategoriesMigration];
