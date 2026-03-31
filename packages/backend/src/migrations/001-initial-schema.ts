import type { Migration } from "./types.js";

export const initialSchemaMigration: Migration = {
  id: "001-initial-schema",
  description: "Create core collections and indexes for auth, expenses, goals, and migration tracking",
  up: async (database) => {
    await database.createCollection("users").catch(() => undefined);
    await database.createCollection("expenses").catch(() => undefined);
    await database.createCollection("goals").catch(() => undefined);
    await database.createCollection("migrations").catch(() => undefined);

    await Promise.all([
      database.collection("users").createIndex({ email: 1 }, { unique: true, name: "users_email_unique" }),
      database.collection("expenses").createIndex({ userId: 1, date: -1 }, { name: "expenses_user_date" }),
      database.collection("expenses").createIndex({ userId: 1, category: 1, date: -1 }, { name: "expenses_user_category_date" }),
      database.collection("goals").createIndex({ userId: 1, createdAt: -1 }, { name: "goals_user_created" }),
      database.collection("migrations").createIndex({ id: 1 }, { unique: true, name: "migrations_id_unique" }),
    ]);
  },
};
