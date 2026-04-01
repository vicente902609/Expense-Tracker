import type { Collection } from "mongodb";

import { getDatabase } from "../../lib/db.js";
import { PREDEFINED_CATEGORY_SEED } from "./predefined-seed.js";

export type PredefinedCategoryDocument = {
  categoryId: string;
  name: string;
  color: string;
  createdAt: string;
};

const COLLECTION = "predefined_categories";

export const getPredefinedCategoriesCollection = async (): Promise<Collection<PredefinedCategoryDocument>> => {
  const database = await getDatabase();
  return database.collection<PredefinedCategoryDocument>(COLLECTION);
};

export const ensurePredefinedCategoriesIndexes = async () => {
  const collection = await getPredefinedCategoriesCollection();
  await collection.createIndex({ categoryId: 1 }, { unique: true });
  await collection.createIndex({ name: 1 }, { unique: true });
};

export const ensurePredefinedCategoriesSeed = async () => {
  await ensurePredefinedCategoriesIndexes();
  const collection = await getPredefinedCategoriesCollection();
  const now = new Date().toISOString();

  for (const row of PREDEFINED_CATEGORY_SEED) {
    await collection.updateOne(
      { categoryId: row.categoryId },
      { $setOnInsert: { categoryId: row.categoryId, name: row.name, color: row.color, createdAt: now } },
      { upsert: true },
    );
  }
};

export const listPredefinedCategoryDocuments = async (): Promise<PredefinedCategoryDocument[]> => {
  const collection = await getPredefinedCategoriesCollection();
  return collection.find({}).sort({ name: 1 }).toArray();
};

export const getPredefinedNameLowerSet = async (): Promise<Set<string>> => {
  const rows = await listPredefinedCategoryDocuments();
  return new Set(rows.map((row) => row.name.toLowerCase()));
};
