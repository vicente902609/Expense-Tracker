import { DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../lib/dynamo';
import type { ExpenseItem } from '../models/expense';

export interface ListExpensesOptions {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  limit?: number;
  cursor?: string;
}

export interface ListExpensesResult {
  items: ExpenseItem[];
  nextCursor?: string;
}

export const createExpense = async (item: ExpenseItem): Promise<void> => {
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
};

export const getExpenseByUser = async (
  userId: string,
  expenseId: string,
): Promise<ExpenseItem | null> => {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `EXP#${expenseId}` },
    }),
  );
  return result.Item ? (result.Item as ExpenseItem) : null;
};

export const updateExpenseByUser = async (
  userId: string,
  expenseId: string,
  updates: {
    amount: number;
    description: string | undefined;
    categoryId: string;
    date: string;
    GSI2PK: string;
    GSI2SK: string;
    GSI3PK: string;
    GSI3SK: string;
    updatedAt: string;
  },
): Promise<ExpenseItem> => {
  const exprValues: Record<string, unknown> = {
    ':amount': updates.amount,
    ':categoryId': updates.categoryId,
    ':date': updates.date,
    ':gsi2pk': updates.GSI2PK,
    ':gsi2sk': updates.GSI2SK,
    ':gsi3pk': updates.GSI3PK,
    ':gsi3sk': updates.GSI3SK,
    ':updatedAt': updates.updatedAt,
  };

  let updateExpression =
    'SET amount = :amount, categoryId = :categoryId, #date = :date, ' +
    'GSI2PK = :gsi2pk, GSI2SK = :gsi2sk, GSI3PK = :gsi3pk, GSI3SK = :gsi3sk, updatedAt = :updatedAt';

  if (updates.description !== undefined) {
    updateExpression += ', description = :description';
    exprValues[':description'] = updates.description;
  } else {
    updateExpression += ' REMOVE description';
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `EXP#${expenseId}` },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: exprValues,
      ConditionExpression: 'attribute_exists(PK)',
      ReturnValues: 'ALL_NEW',
    }),
  );
  return result.Attributes as ExpenseItem;
};

export const deleteExpenseByUser = async (userId: string, expenseId: string): Promise<void> => {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `EXP#${expenseId}` },
      ConditionExpression: 'attribute_exists(PK)',
    }),
  );
};

export const listExpensesByUser = async (
  userId: string,
  options: ListExpensesOptions,
): Promise<ListExpensesResult> => {
  const limit = Math.min(options.limit ?? 50, 100);

  let exclusiveStartKey: Record<string, unknown> | undefined;
  if (options.cursor) {
    try {
      exclusiveStartKey = JSON.parse(Buffer.from(options.cursor, 'base64url').toString('utf8'));
    } catch {
      // invalid cursor — ignore, start from beginning
    }
  }

  const pagination = exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey as never } : {};

  let result: QueryCommandOutput;

  if (options.categoryId) {
    const keyConditionParts = ['GSI3PK = :pk'];
    const exprValues: Record<string, unknown> = {
      ':pk': `USER#${userId}#CAT#${options.categoryId}`,
    };

    if (options.startDate && options.endDate) {
      keyConditionParts.push('GSI3SK BETWEEN :start AND :end');
      exprValues[':start'] = `DATE#${options.startDate}`;
      exprValues[':end'] = `DATE#${options.endDate}~`;
    } else if (options.startDate) {
      keyConditionParts.push('GSI3SK >= :start');
      exprValues[':start'] = `DATE#${options.startDate}`;
    } else if (options.endDate) {
      keyConditionParts.push('GSI3SK <= :end');
      exprValues[':end'] = `DATE#${options.endDate}~`;
    }

    result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI3-UserCategoryDateIndex',
        KeyConditionExpression: keyConditionParts.join(' AND '),
        ExpressionAttributeValues: exprValues,
        Limit: limit,
        ...pagination,
      }),
    );
  } else if (options.startDate || options.endDate) {
    const keyConditionParts = ['GSI2PK = :pk'];
    const exprValues: Record<string, unknown> = { ':pk': `USER#${userId}` };

    if (options.startDate && options.endDate) {
      keyConditionParts.push('GSI2SK BETWEEN :start AND :end');
      exprValues[':start'] = `DATE#${options.startDate}`;
      exprValues[':end'] = `DATE#${options.endDate}~`;
    } else if (options.startDate) {
      keyConditionParts.push('GSI2SK >= :start');
      exprValues[':start'] = `DATE#${options.startDate}`;
    } else {
      keyConditionParts.push('GSI2SK <= :end');
      exprValues[':end'] = `DATE#${options.endDate}~`;
    }

    result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2-UserExpenseDateIndex',
        KeyConditionExpression: keyConditionParts.join(' AND '),
        ExpressionAttributeValues: exprValues,
        Limit: limit,
        ...pagination,
      }),
    );
  } else {
    result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':prefix': 'EXP#',
        },
        Limit: limit,
        ...pagination,
      }),
    );
  }

  const nextCursor = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url')
    : undefined;

  return {
    items: (result.Items ?? []) as ExpenseItem[],
    nextCursor,
  };
};
