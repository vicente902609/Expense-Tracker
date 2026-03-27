import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { migrations } from "./index.js";

type MigrationRecord = {
  id: string;
  description: string;
  appliedAt: string;
};

const currentDirectory = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(currentDirectory, "../../.env") });
config({ path: resolve(currentDirectory, "../../../../.env") });

const migrationEnv = z
  .object({
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    MONGODB_DB_NAME: z.string().min(1, "MONGODB_DB_NAME is required"),
  })
  .parse(process.env);

const run = async () => {
  const client = await new MongoClient(migrationEnv.MONGODB_URI).connect();

  try {
    const database = client.db(migrationEnv.MONGODB_DB_NAME);
    const migrationsCollection = database.collection<MigrationRecord>("migrations");

    for (const migration of migrations) {
      const existingRecord = await migrationsCollection.findOne({ id: migration.id });

      if (existingRecord) {
        console.log(`Skipping ${migration.id} (${migration.description})`);
        continue;
      }

      console.log(`Applying ${migration.id} (${migration.description})`);
      await migration.up(database);
      await migrationsCollection.insertOne({
        id: migration.id,
        description: migration.description,
        appliedAt: new Date().toISOString(),
      });
      console.log(`Applied ${migration.id}`);
    }
  } finally {
    await client.close();
  }
};

run().catch((error) => {
  console.error("Migration run failed");
  console.error(error);
  process.exitCode = 1;
});
