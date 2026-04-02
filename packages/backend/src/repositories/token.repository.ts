import { DeleteCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo';
import type { RefreshTokenItem } from '../models/user';

export const putRefreshToken = async (item: RefreshTokenItem): Promise<void> => {
  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: item }),
  );
};

export const getRefreshToken = async (
  userId: string,
  tokenId: string,
): Promise<RefreshTokenItem | undefined> => {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `TOKEN#${tokenId}` },
    }),
  );
  return result.Item as RefreshTokenItem | undefined;
};

export const deleteRefreshToken = async (
  userId: string,
  tokenId: string,
): Promise<void> => {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `TOKEN#${tokenId}` },
    }),
  );
};
