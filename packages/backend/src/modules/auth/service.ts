import { authPayloadSchema, type AuthResponse } from "@expense-tracker/shared";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { createUser, getUserByEmail } from "../users/repository.js";

const signToken = (userId: string) =>
  jwt.sign(
    {
      sub: userId,
    },
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

export const registerUser = async (payload: unknown): Promise<AuthResponse> => {
  const input = authPayloadSchema
    .extend({
      name: z.string().trim().min(2).max(80),
    })
    .parse(payload);

  const existingUser = await getUserByEmail(input.email);

  if (existingUser) {
    throw new AppError("An account with that email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await createUser({
    email: input.email,
    passwordHash,
    name: input.name,
  });

  return {
    token: signToken(user.id),
    user,
  };
};

export const loginUser = async (payload: unknown): Promise<AuthResponse> => {
  const input = authPayloadSchema.parse(payload);
  const userDocument = await getUserByEmail(input.email);

  if (!userDocument) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, userDocument.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    token: signToken(userDocument._id.toHexString()),
    user: {
      id: userDocument._id.toHexString(),
      email: userDocument.email,
      name: userDocument.name,
      createdAt: userDocument.createdAt,
    },
  };
};
