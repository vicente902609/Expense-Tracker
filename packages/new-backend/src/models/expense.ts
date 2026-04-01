// DynamoDB item shape
export interface ExpenseItem {
  PK: string;       // USER#<userId>
  SK: string;       // EXP#<expenseId>
  GSI2PK: string;   // USER#<userId>
  GSI2SK: string;   // DATE#<YYYY-MM-DD>#<expenseId>
  GSI3PK: string;   // USER#<userId>#CAT#<categoryId>
  GSI3SK: string;   // DATE#<YYYY-MM-DD>#<expenseId>
  expenseId: string;
  amount: number;
  description?: string;
  categoryId: string;
  date: string;     // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

// API response shape
export interface Expense {
  expenseId: string;
  amount: number;
  description?: string;
  categoryId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export const toExpense = (item: ExpenseItem): Expense => ({
  expenseId: item.expenseId,
  amount: item.amount,
  description: item.description,
  categoryId: item.categoryId,
  date: item.date,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});
