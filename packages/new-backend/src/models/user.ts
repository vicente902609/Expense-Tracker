// DynamoDB item shapes
export interface UserItem {
  PK: string;       // USER#<userId>
  SK: 'METADATA';
  GSI1PK: string;   // EMAIL#<email>
  GSI1SK: string;   // USER#<userId>
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenItem {
  PK: string;       // USER#<userId>
  SK: string;       // TOKEN#<tokenId>
  tokenId: string;
  expiresAt: number; // Unix epoch seconds — used as DynamoDB TTL attribute
  createdAt: string;
}

// Domain/API shape (never exposes passwordHash)
export interface User {
  userId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
