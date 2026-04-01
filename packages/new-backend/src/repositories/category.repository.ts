import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo';
import type { CategoryItem } from '../models/category';
import { PREDEFINED_PK } from '../models/category';

export const listPredefinedCategories = async (): Promise<CategoryItem[]> => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': PREDEFINED_PK,
        ':prefix': 'CAT#',
      },
    }),
  );
  return (result.Items ?? []) as CategoryItem[];
};

export const listCustomCategoriesByUser = async (userId: string): Promise<CategoryItem[]> => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':prefix': 'CAT#',
      },
    }),
  );
  return (result.Items ?? []) as CategoryItem[];
};

export const createCategory = async (item: CategoryItem): Promise<void> => {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );
};
