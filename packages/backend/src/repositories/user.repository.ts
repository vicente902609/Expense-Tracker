import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo';
import type { UserItem } from '../models/user';

export const getUserById = async (userId: string): Promise<UserItem | undefined> => {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'METADATA' },
    }),
  );
  return result.Item as UserItem | undefined;
};

export const getUserByEmail = async (email: string): Promise<UserItem | undefined> => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1-EmailIndex',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: { ':gsi1pk': `EMAIL#${email}` },
      Limit: 1,
    }),
  );
  return result.Items?.[0] as UserItem | undefined;
};

/**
 * Atomically creates the user item, failing if the email already exists.
 * Returns false if the email is already taken, true on success.
 */
export const createUser = async (item: UserItem): Promise<boolean> => {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: 'attribute_not_exists(GSI1PK)',
      }),
    );
    return true;
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return false;
    throw err;
  }
};


