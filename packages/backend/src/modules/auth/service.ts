import type { AuthSessionData, AuthTokens, RefreshTokensData } from "@expense-tracker/shared";
import bcrypt from "bcryptjs";

import { AppError } from "../../lib/errors.js";
import { refreshTokenExpiresAt, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { deleteRefreshToken, getRefreshToken, putRefreshToken } from "./refresh-token.repository.js";
import { createUser, getUserByEmail, toPublicUser } from "../users/repository.js";

const BCRYPT_ROUNDS = 12;

export type RegisterError = "EMAIL_TAKEN";
export type LoginError = "INVALID_CREDENTIALS";
export type RefreshError = "INVALID_TOKEN";

const issueTokensForUser = async (userId: string): Promise<AuthTokens> => {
  const tokenId = crypto.randomUUID();
  const now = new Date().toISOString();
  await putRefreshToken({
    userId,
    tokenId,
    expiresAt: refreshTokenExpiresAt(),
    createdAt: now,
  });
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId, tokenId),
  };
};

export const logoutUser = async (userId: string, rawRefreshToken: string): Promise<void> => {
  let tokenId: string;
  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    tokenId = payload.jti;
  } catch {
    return;
  }
  await deleteRefreshToken(userId, tokenId);
};

export const refreshTokens = async (rawRefreshToken: string): Promise<RefreshTokensData | RefreshError> => {
  let userId: string;
  let tokenId: string;

  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    userId = payload.sub;
    tokenId = payload.jti;
  } catch {
    return "INVALID_TOKEN";
  }

  const stored = await getRefreshToken(userId, tokenId);
  if (!stored) {
    return "INVALID_TOKEN";
  }

  await deleteRefreshToken(userId, tokenId);

  const newTokenId = crypto.randomUUID();
  const now = new Date().toISOString();
  await putRefreshToken({
    userId,
    tokenId: newTokenId,
    expiresAt: refreshTokenExpiresAt(),
    createdAt: now,
  });

  return {
    tokens: {
      accessToken: signAccessToken(userId),
      refreshToken: signRefreshToken(userId, newTokenId),
    },
  };
};

export const loginUser = async (email: string, password: string): Promise<AuthSessionData | LoginError> => {
  const userItem = await getUserByEmail(email.toLowerCase());
  if (!userItem) {
    return "INVALID_CREDENTIALS";
  }

  const passwordMatch = await bcrypt.compare(password, userItem.passwordHash);
  if (!passwordMatch) {
    return "INVALID_CREDENTIALS";
  }

  const userId = userItem._id!.toHexString();
  const tokens = await issueTokensForUser(userId);

  return {
    user: toPublicUser(userItem),
    tokens,
  };
};

export const registerUser = async (email: string, password: string, name: string): Promise<AuthSessionData | RegisterError> => {
  const existing = await getUserByEmail(email.toLowerCase());
  if (existing) {
    return "EMAIL_TAKEN";
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const created = await createUser({
    email: email.toLowerCase(),
    passwordHash,
    name,
  });

  const document = await getUserByEmail(email.toLowerCase());
  if (!document) {
    throw new AppError("Registration failed", 500);
  }

  const tokens = await issueTokensForUser(created.id);

  return {
    user: toPublicUser(document),
    tokens,
  };
};
