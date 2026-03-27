import type { User } from "@expense-tracker/shared";
import { ObjectId } from "mongodb";

import { getDatabase } from "../../lib/db.js";
import { toObjectId } from "../../lib/object-id.js";

type UserDocument = {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
};

type NewUserDocument = Omit<UserDocument, "_id">;

const mapUser = (document: UserDocument): User => ({
  id: document._id!.toHexString(),
  email: document.email,
  name: document.name,
  createdAt: document.createdAt,
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
  };

  const result = await collection.insertOne(document);

  return mapUser({
    _id: result.insertedId,
    ...document,
  });
};
