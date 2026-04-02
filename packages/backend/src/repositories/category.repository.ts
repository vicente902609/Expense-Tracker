import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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

export const getCategoryByUser = async (
  userId: string,
  categoryId: string,
): Promise<CategoryItem | null> => {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `CAT#${categoryId}`,
      },
    }),
  );
  return result.Item ? (result.Item as CategoryItem) : null;
};

export const updateCategoryByUser = async (
  userId: string,
  categoryId: string,
  updates: { name?: string; color?: string },
): Promise<CategoryItem> => {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `CAT#${categoryId}`,
      },
      UpdateExpression: 'SET #name = :name, color = :color',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': updates.name,
        ':color': updates.color,
      },
      ConditionExpression: 'attribute_exists(PK)',
      ReturnValues: 'ALL_NEW',
    }),
  );
  return result.Attributes as CategoryItem;
};

export const deleteCategoryByUser = async (
  userId: string,
  categoryId: string,
): Promise<void> => {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `CAT#${categoryId}`,
      },
      ConditionExpression: 'attribute_exists(PK)',
    }),
  );
};
