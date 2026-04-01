import { ObjectId } from "mongodb";

import type { Migration } from "./types.js";

export const userCustomCategoryDocsMigration: Migration = {
  id: "004-user-custom-category-docs",
  description: "Migrate user custom categories to { categoryId, name, color?, createdAt }[]; remove legacy string[] + color map",
  up: async (database) => {
    const users = database.collection("users");
    const cursor = users.find({});

    for await (const doc of cursor) {
      const existing = doc.customCategoryDocs as unknown;
      if (
        Array.isArray(existing) &&
        (existing.length === 0 || (typeof existing[0] === "object" && existing[0] !== null && "categoryId" in (existing[0] as object)))
      ) {
        if (doc.customCategories !== undefined || doc.customCategoryColors !== undefined) {
          await users.updateOne(
            { _id: doc._id },
            {
              $unset: { customCategories: "", customCategoryColors: "" },
            },
          );
        }
        continue;
      }

      const legacyNames = doc.customCategories as unknown;
      const colors = (doc.customCategoryColors ?? {}) as Record<string, string>;
      const now = new Date().toISOString();
      let docs: Array<{ categoryId: string; name: string; color?: string; createdAt: string }> = [];

      if (Array.isArray(legacyNames) && legacyNames.length > 0 && typeof legacyNames[0] === "string") {
        docs = legacyNames.map((name: string) => ({
          categoryId: new ObjectId().toHexString(),
          name,
          ...(typeof colors[name] === "string" ? { color: colors[name] } : {}),
          createdAt: now,
        }));
      }

      await users.updateOne(
        { _id: doc._id },
        {
          $set: { customCategoryDocs: docs },
          $unset: { customCategories: "", customCategoryColors: "" },
        },
      );
    }
  },
};
