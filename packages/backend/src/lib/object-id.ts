import { ObjectId } from "mongodb";

import { AppError } from "./errors.js";

export const toObjectId = (value: string) => {
  if (!ObjectId.isValid(value)) {
    throw new AppError("Invalid resource id", 400);
  }

  return new ObjectId(value);
};
