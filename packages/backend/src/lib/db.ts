import { MongoClient } from "mongodb";

import { env } from "../config/env.js";

let clientPromise: Promise<MongoClient> | null = null;

const getClient = async () => {
  if (!clientPromise) {
    clientPromise = new MongoClient(env.MONGODB_URI).connect();
  }

  return clientPromise;
};

export const getDatabase = async () => {
  const client = await getClient();
  return client.db(env.MONGODB_DB_NAME);
};
