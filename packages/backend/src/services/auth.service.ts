import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { refreshTokenExpiresAt, signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import type { User } from '../models/user';
import { deleteRefreshToken, getRefreshToken, putRefreshToken } from '../repositories/token.repository';
import { createUser, getUserByEmail } from '../repositories/user.repository';

const BCRYPT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResult {
  user: User;
  tokens: AuthTokens;
}

export type RegisterError = 'EMAIL_TAKEN';
export type LoginError = 'INVALID_CREDENTIALS';
export type RefreshError = 'INVALID_TOKEN';

export const logoutUser = async (userId: string, rawRefreshToken: string): Promise<void> => {
  let tokenId: string;
  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    tokenId = payload.jti;
  } catch {
    // Token is already invalid/expired — nothing to revoke
    return;
  }
  await deleteRefreshToken(userId, tokenId);
};

export const refreshTokens = async (
  rawRefreshToken: string,
): Promise<{ tokens: AuthTokens } | RefreshError> => {
  let userId: string;
  let tokenId: string;

  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    userId = payload.sub;
    tokenId = payload.jti;
  } catch {
    return 'INVALID_TOKEN';
  }

  const stored = await getRefreshToken(userId, tokenId);
  if (!stored) return 'INVALID_TOKEN';

  // Rotate: delete old token and issue a new one atomically
  await deleteRefreshToken(userId, tokenId);

  const newTokenId = uuidv4();
  await putRefreshToken({
    PK: `USER#${userId}`,
    SK: `TOKEN#${newTokenId}`,
    tokenId: newTokenId,
    expiresAt: refreshTokenExpiresAt(),
    createdAt: new Date().toISOString(),
  });

  return {
    tokens: {
      accessToken: signAccessToken(userId),
      refreshToken: signRefreshToken(userId, newTokenId),
    },
  };
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<RegisterResult | LoginError> => {
  const userItem = await getUserByEmail(email.toLowerCase());
  if (!userItem) return 'INVALID_CREDENTIALS';

  const passwordMatch = await bcrypt.compare(password, userItem.passwordHash);
  if (!passwordMatch) return 'INVALID_CREDENTIALS';

  const tokenId = uuidv4();
  const now = new Date().toISOString();

  await putRefreshToken({
    PK: `USER#${userItem.userId}`,
    SK: `TOKEN#${tokenId}`,
    tokenId,
    expiresAt: refreshTokenExpiresAt(),
    createdAt: now,
  });

  return {
    user: {
      userId: userItem.userId,
      name: userItem.name,
      email: userItem.email,
      createdAt: userItem.createdAt,
      updatedAt: userItem.updatedAt,
    },
    tokens: {
      accessToken: signAccessToken(userItem.userId),
      refreshToken: signRefreshToken(userItem.userId, tokenId),
    },
  };
};

export const registerUser = async (
  email: string,
  password: string,
  name: string,
): Promise<RegisterResult | RegisterError> => {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userId = uuidv4();
  const now = new Date().toISOString();

  const created = await createUser({
    PK: `USER#${userId}`,
    SK: 'METADATA',
    GSI1PK: `EMAIL#${email.toLowerCase()}`,
    GSI1SK: `USER#${userId}`,
    userId,
    name,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  if (!created) return 'EMAIL_TAKEN';

  const tokenId = uuidv4();
  await putRefreshToken({
    PK: `USER#${userId}`,
    SK: `TOKEN#${tokenId}`,
    tokenId,
    expiresAt: refreshTokenExpiresAt(),
    createdAt: now,
  });

  return {
    user: { userId, name, email: email.toLowerCase(), createdAt: now, updatedAt: now },
    tokens: {
      accessToken: signAccessToken(userId),
      refreshToken: signRefreshToken(userId, tokenId),
    },
  };
};
