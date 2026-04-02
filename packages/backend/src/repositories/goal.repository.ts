import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo';
import type { GoalItem } from '../models/goal';

export const getGoal = async (userId: string): Promise<GoalItem | null> => {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: 'GOAL' },
    }),
  );
  return result.Item ? (result.Item as GoalItem) : null;
};

export const createGoal = async (item: GoalItem): Promise<void> => {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(SK)',
    }),
  );
};

export const updateGoalAttributes = async (
  userId: string,
  updates: { name: string; targetExpense: number; updatedAt: string },
): Promise<GoalItem | null> => {
  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'GOAL' },
        UpdateExpression: 'SET #name = :name, targetExpense = :targetExpense, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: {
          ':name': updates.name,
          ':targetExpense': updates.targetExpense,
          ':updatedAt': updates.updatedAt,
        },
        ConditionExpression: 'attribute_exists(PK)',
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes as GoalItem;
  } catch (error) {
    if ((error as { name?: string }).name === 'ConditionalCheckFailedException') return null;
    throw error;
  }
};

export const updateGoalInsight = async (
  userId: string,
  insight: string,
  insightUpdatedAt: string,
): Promise<void> => {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'GOAL' },
        UpdateExpression: 'SET insight = :insight, insightUpdatedAt = :insightUpdatedAt',
        ExpressionAttributeValues: {
          ':insight': insight,
          ':insightUpdatedAt': insightUpdatedAt,
        },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
  } catch (error) {
    if ((error as { name?: string }).name === 'ConditionalCheckFailedException') return;
    throw error;
  }
};

export const deleteGoal = async (userId: string): Promise<boolean> => {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: 'GOAL' },
        ConditionExpression: 'attribute_exists(PK)',
      }),
    );
    return true;
  } catch (error) {
    if ((error as { name?: string }).name === 'ConditionalCheckFailedException') return false;
    throw error;
  }
};
