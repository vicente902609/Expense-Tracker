/**
 * Seed script — writes the 11 predefined expense categories into DynamoDB.
 *
 * Usage:
 *   TABLE_NAME=expense-tracker-dev AWS_REGION=us-east-1 npx ts-node src/scripts/seed-categories.ts
 *
 * Idempotent: uses BatchWriteCommand which overwrites with identical data, so re-running is safe.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { PREDEFINED_PK } from '../models/category';

const PREDEFINED_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: 'Food',           color: '#FF6B6B' },
  { name: 'Transport',      color: '#4ECDC4' },
  { name: 'Housing',        color: '#45B7D1' },
  { name: 'Utilities',      color: '#96CEB4' },
  { name: 'Entertainment',  color: '#FFEAA7' },
  { name: 'Health',         color: '#DDA0DD' },
  { name: 'Shopping',       color: '#98D8C8' },
  { name: 'Travel',         color: '#F7DC6F' },
  { name: 'Education',      color: '#85C1E9' },
  { name: 'Subscriptions',  color: '#F8C471' },
  { name: 'Other',          color: '#BDC3C7' },
];

const TABLE_NAME = process.env.TABLE_NAME ?? 'expense-tracker-dev';
const AWS_REGION  = process.env.AWS_REGION  ?? 'us-east-1';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }));

const run = async () => {
  const now = new Date().toISOString();

  const putRequests = PREDEFINED_CATEGORIES.map(({ name, color }) => {
    const categoryId = uuidv4();
    return {
      PutRequest: {
        Item: {
          PK: PREDEFINED_PK,
          SK: `CAT#${categoryId}`,
          categoryId,
          name,
          color,
          createdAt: now,
        },
      },
    };
  });

  // BatchWriteCommand accepts at most 25 items per call; our list is 11 so one batch suffices.
  await docClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: putRequests,
      },
    }),
  );

  console.log(`✓ Seeded ${putRequests.length} predefined categories into "${TABLE_NAME}".`);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
