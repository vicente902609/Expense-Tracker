// DynamoDB item shape
export interface GoalItem {
  PK: string;       // USER#<userId>
  SK: 'GOAL';
  name: string;
  targetExpense: number;
  insight: string;
  insightUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

// API response shape
export interface Goal {
  name: string;
  targetExpense: number;
  insight: string;
  insightUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const toGoal = (item: GoalItem): Goal => ({
  name: item.name,
  targetExpense: item.targetExpense,
  insight: item.insight,
  insightUpdatedAt: item.insightUpdatedAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});
