import { getDatabase } from "../../lib/db.js";

export type RefreshTokenRow = {
  userId: string;
  tokenId: string;
  expiresAt: Date;
  createdAt: string;
};

const collectionName = "refresh_tokens";

const getCollection = async () => {
  const database = await getDatabase();
  return database.collection<RefreshTokenRow>(collectionName);
};

export const ensureRefreshTokenIndexes = async () => {
  const collection = await getCollection();
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await collection.createIndex({ userId: 1, tokenId: 1 }, { unique: true });
};

export const putRefreshToken = async (row: RefreshTokenRow) => {
  const collection = await getCollection();
  await collection.insertOne(row);
};

export const getRefreshToken = async (userId: string, tokenId: string) => {
  const collection = await getCollection();
  return collection.findOne({ userId, tokenId });
};

export const deleteRefreshToken = async (userId: string, tokenId: string) => {
  const collection = await getCollection();
  await collection.deleteOne({ userId, tokenId });
};
