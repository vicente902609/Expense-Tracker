import type { PublicUser, User } from "@expense-tracker/shared";
import { ObjectId } from "mongodb";

import { getDatabase } from "../../lib/db.js";
import { toObjectId } from "../../lib/object-id.js";

export type UserCustomCategoryDoc = {
  categoryId: string;
  name: string;
  color?: string;
  createdAt: string;
};

type UserDocument = {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  customCategoryDocs?: UserCustomCategoryDoc[];
  /** @deprecated Migrated to `customCategoryDocs`; optional for lazy migration */
  customCategories?: string[];
  customCategoryColors?: Record<string, string>;
};

type NewUserDocument = Omit<UserDocument, "_id">;

const mapUser = (document: UserDocument): User => ({
  id: document._id!.toHexString(),
  email: document.email,
  name: document.name,
  createdAt: document.createdAt,
});

export const toPublicUser = (document: UserDocument): PublicUser => ({
  userId: document._id!.toHexString(),
  email: document.email,
  name: document.name,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt ?? document.createdAt,
});

export const getUsersCollection = async () => {
  const database = await getDatabase();
  return database.collection<UserDocument>("users");
};

export const getUserByEmail = async (email: string) => {
  const collection = await getUsersCollection();
  return collection.findOne({ email: email.toLowerCase() });
};

export const getUserById = async (id: string) => {
  const collection = await getUsersCollection();
  const document = await collection.findOne({ _id: toObjectId(id) });
  return document ? mapUser(document) : null;
};

export const createUser = async (input: { email: string; passwordHash: string; name: string }) => {
  const collection = await getUsersCollection();
  const now = new Date().toISOString();
  const document: NewUserDocument = {
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    name: input.name,
    createdAt: now,
    updatedAt: now,
    customCategoryDocs: [],
  };

  const result = await collection.insertOne(document);

  return mapUser({
    _id: result.insertedId,
    ...document,
  });
};

const migrateLegacyUserCategoriesIfNeeded = async (userId: string): Promise<UserCustomCategoryDoc[]> => {
  const collection = await getUsersCollection();
  const document = await collection.findOne({ _id: toObjectId(userId) });
  if (!document) {
    return [];
  }

  const legacy = document.customCategories as unknown;
  if (!Array.isArray(legacy) || legacy.length === 0 || typeof legacy[0] !== "string") {
    return [];
  }

  const colors = (document.customCategoryColors ?? {}) as Record<string, string>;
  const now = new Date().toISOString();
  const docs: UserCustomCategoryDoc[] = legacy.map((name) => ({
    categoryId: new ObjectId().toHexString(),
    name,
    ...(typeof colors[name] === "string" ? { color: colors[name] } : {}),
    createdAt: now,
  }));

  await collection.updateOne(
    { _id: toObjectId(userId) },
    { $set: { customCategoryDocs: docs }, $unset: { customCategories: "", customCategoryColors: "" } },
  );

  return docs;
};

export const getUserCustomCategoryDocs = async (userId: string): Promise<UserCustomCategoryDoc[]> => {
  const collection = await getUsersCollection();
  const document = await collection.findOne({ _id: toObjectId(userId) }, { projection: { customCategoryDocs: 1, customCategories: 1 } });
  if (!document) {
    return [];
  }

  const docs = document.customCategoryDocs;
  if (Array.isArray(docs) && (docs.length === 0 || (typeof docs[0] === "object" && docs[0] !== null && "categoryId" in docs[0]))) {
    return docs as UserCustomCategoryDoc[];
  }

  return migrateLegacyUserCategoriesIfNeeded(userId);
};

export const setUserCustomCategoryDocs = async (userId: string, docs: UserCustomCategoryDoc[]) => {
  const collection = await getUsersCollection();
  await collection.updateOne({ _id: toObjectId(userId) }, { $set: { customCategoryDocs: docs } });
};

export const getUserCustomCategories = async (userId: string) => {
  const docs = await getUserCustomCategoryDocs(userId);
  return docs.map((d) => d.name);
};
