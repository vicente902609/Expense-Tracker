import { getMonthlyReport, getByCategoryReport } from '../reports.service';
import { fetchAllExpensesInDateRange } from '../../repositories/expense.repository';
import type { ExpenseItem } from '../../models/expense';

jest.mock('../../repositories/expense.repository');

const mockFetchAll = fetchAllExpensesInDateRange as jest.MockedFunction<
  typeof fetchAllExpensesInDateRange
>;

const makeExpense = (overrides: Partial<ExpenseItem>): ExpenseItem => ({
  PK: 'USER#u1',
  SK: 'EXP#e1',
  GSI2PK: 'USER#u1',
  GSI2SK: 'DATE#2025-01-01#e1',
  GSI3PK: 'USER#u1#CAT#cat1',
  GSI3SK: 'DATE#2025-01-01#e1',
  expenseId: 'e1',
  amount: 10,
  categoryId: 'cat1',
  date: '2025-01-01',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('getMonthlyReport', () => {
  beforeEach(() => {
    mockFetchAll.mockReset();
  });

  it('returns empty months array when there are no expenses', async () => {
    mockFetchAll.mockResolvedValue([]);

    const result = await getMonthlyReport('u1');

    expect(result).toEqual({ months: [] });
  });

  it('groups a single expense into the correct month', async () => {
    mockFetchAll.mockResolvedValue([makeExpense({ amount: 50, date: '2025-03-15' })]);

    const result = await getMonthlyReport('u1');

    expect(result.months).toEqual([{ month: '2025-03', total: 50, count: 1 }]);
  });

  it('accumulates multiple expenses in the same month', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 20, date: '2025-06-01' }),
      makeExpense({ expenseId: 'e2', amount: 30.5, date: '2025-06-15' }),
      makeExpense({ expenseId: 'e3', amount: 10, date: '2025-06-30' }),
    ]);

    const result = await getMonthlyReport('u1');

    expect(result.months).toEqual([{ month: '2025-06', total: 60.5, count: 3 }]);
  });

  it('splits expenses across different months into separate entries', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 100, date: '2025-01-10' }),
      makeExpense({ expenseId: 'e2', amount: 200, date: '2025-03-05' }),
    ]);

    const result = await getMonthlyReport('u1');

    expect(result.months).toEqual([
      { month: '2025-01', total: 100, count: 1 },
      { month: '2025-03', total: 200, count: 1 },
    ]);
  });

  it('sorts months chronologically (ascending)', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 10, date: '2025-12-01' }),
      makeExpense({ expenseId: 'e2', amount: 20, date: '2025-01-01' }),
      makeExpense({ expenseId: 'e3', amount: 30, date: '2025-06-15' }),
    ]);

    const result = await getMonthlyReport('u1');

    expect(result.months.map((m) => m.month)).toEqual(['2025-01', '2025-06', '2025-12']);
  });

  it('rounds totals to 2 decimal places to avoid floating-point drift', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 0.1, date: '2025-02-01' }),
      makeExpense({ expenseId: 'e2', amount: 0.2, date: '2025-02-02' }),
    ]);

    const result = await getMonthlyReport('u1');

    expect(result.months[0].total).toBe(0.3);
  });

  it('forwards userId, startDate, and endDate to the repository', async () => {
    mockFetchAll.mockResolvedValue([]);

    await getMonthlyReport('user-42', '2025-01-01', '2025-06-30');

    expect(mockFetchAll).toHaveBeenCalledWith('user-42', '2025-01-01', '2025-06-30');
  });

  it('returns correct count per month', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', date: '2025-04-01' }),
      makeExpense({ expenseId: 'e2', date: '2025-04-15' }),
      makeExpense({ expenseId: 'e3', date: '2025-04-28' }),
    ]);

    const result = await getMonthlyReport('u1');

    expect(result.months[0].count).toBe(3);
  });

  it('spans expenses across year boundaries correctly', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 500, date: '2024-12-31' }),
      makeExpense({ expenseId: 'e2', amount: 100, date: '2025-01-01' }),
    ]);

    const result = await getMonthlyReport('u1');

    expect(result.months).toEqual([
      { month: '2024-12', total: 500, count: 1 },
      { month: '2025-01', total: 100, count: 1 },
    ]);
  });
});

describe('getByCategoryReport', () => {
  beforeEach(() => {
    mockFetchAll.mockReset();
  });

  it('returns empty categories array when there are no expenses', async () => {
    mockFetchAll.mockResolvedValue([]);

    const result = await getByCategoryReport('u1');

    expect(result).toEqual({ categories: [] });
  });

  it('groups a single expense into the correct category', async () => {
    mockFetchAll.mockResolvedValue([makeExpense({ amount: 50, categoryId: 'cat1' })]);

    const result = await getByCategoryReport('u1');

    expect(result.categories).toEqual([{ categoryId: 'cat1', total: 50, count: 1 }]);
  });

  it('accumulates multiple expenses in the same category', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 20, categoryId: 'cat1' }),
      makeExpense({ expenseId: 'e2', amount: 30.5, categoryId: 'cat1' }),
      makeExpense({ expenseId: 'e3', amount: 10, categoryId: 'cat1' }),
    ]);

    const result = await getByCategoryReport('u1');

    expect(result.categories).toEqual([{ categoryId: 'cat1', total: 60.5, count: 3 }]);
  });

  it('splits expenses across different categories into separate entries', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 100, categoryId: 'cat1' }),
      makeExpense({ expenseId: 'e2', amount: 200, categoryId: 'cat2' }),
    ]);

    const result = await getByCategoryReport('u1');

    expect(result.categories).toHaveLength(2);
    expect(result.categories.find((c) => c.categoryId === 'cat1')).toEqual({
      categoryId: 'cat1',
      total: 100,
      count: 1,
    });
    expect(result.categories.find((c) => c.categoryId === 'cat2')).toEqual({
      categoryId: 'cat2',
      total: 200,
      count: 1,
    });
  });

  it('sorts categories by total descending', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 50, categoryId: 'cat-low' }),
      makeExpense({ expenseId: 'e2', amount: 300, categoryId: 'cat-high' }),
      makeExpense({ expenseId: 'e3', amount: 150, categoryId: 'cat-mid' }),
    ]);

    const result = await getByCategoryReport('u1');

    expect(result.categories.map((c) => c.categoryId)).toEqual([
      'cat-high',
      'cat-mid',
      'cat-low',
    ]);
  });

  it('rounds totals to 2 decimal places to avoid floating-point drift', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 0.1, categoryId: 'cat1' }),
      makeExpense({ expenseId: 'e2', amount: 0.2, categoryId: 'cat1' }),
    ]);

    const result = await getByCategoryReport('u1');

    expect(result.categories[0].total).toBe(0.3);
  });

  it('forwards userId, startDate, and endDate to the repository', async () => {
    mockFetchAll.mockResolvedValue([]);

    await getByCategoryReport('user-42', '2025-01-01', '2025-06-30');

    expect(mockFetchAll).toHaveBeenCalledWith('user-42', '2025-01-01', '2025-06-30');
  });

  it('returns correct count per category', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', categoryId: 'cat1' }),
      makeExpense({ expenseId: 'e2', categoryId: 'cat1' }),
      makeExpense({ expenseId: 'e3', categoryId: 'cat1' }),
    ]);

    const result = await getByCategoryReport('u1');

    expect(result.categories[0].count).toBe(3);
  });

  it('handles expenses spanning multiple categories and accumulates each independently', async () => {
    mockFetchAll.mockResolvedValue([
      makeExpense({ expenseId: 'e1', amount: 40, categoryId: 'food' }),
      makeExpense({ expenseId: 'e2', amount: 60, categoryId: 'food' }),
      makeExpense({ expenseId: 'e3', amount: 200, categoryId: 'rent' }),
      makeExpense({ expenseId: 'e4', amount: 15, categoryId: 'transport' }),
    ]);

    const result = await getByCategoryReport('u1');

    expect(result.categories).toEqual([
      { categoryId: 'rent', total: 200, count: 1 },
      { categoryId: 'food', total: 100, count: 2 },
      { categoryId: 'transport', total: 15, count: 1 },
    ]);
  });
});
