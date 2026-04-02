import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Expense } from "@/types";
import { useExpenseEditor } from "@/pages/expenses/hooks/use-expense-editor";

const parseExpenseTextMock = vi.fn();
const createExpenseMock = vi.fn();
const updateExpenseMock = vi.fn();
const deleteExpenseMock = vi.fn();

vi.mock("@/api/ai", () => ({
  parseExpenseText: (...args: unknown[]) => parseExpenseTextMock(...args),
}));

vi.mock("@/api/expenses", () => ({
  createExpense: (...args: unknown[]) => createExpenseMock(...args),
  updateExpense: (...args: unknown[]) => updateExpenseMock(...args),
  deleteExpense: (...args: unknown[]) => deleteExpenseMock(...args),
}));

const palette = [{ categoryId: "food-id", name: "Food", color: "#FF9900" }] as const;

const sampleExpense: Expense = {
  expenseId: "exp-1",
  amount: 9.5,
  description: "Coffee",
  categoryId: "food-id",
  date: "2026-04-10",
  createdAt: "2026-04-10T10:00:00.000Z",
  updatedAt: "2026-04-10T10:00:00.000Z",
};

const createWrapper = (client: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };

describe("useExpenseEditor", () => {
  beforeEach(() => {
    parseExpenseTextMock.mockReset();
    createExpenseMock.mockReset();
    updateExpenseMock.mockReset();
    deleteExpenseMock.mockReset();
  });

  it("maps parse result into form fields", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    parseExpenseTextMock.mockResolvedValue({
      amount: 14.25,
      date: "2026-04-20",
      description: "Lunch",
      category: "Food",
      confidence: 0.9,
      notes: [],
    });

    const { result } = renderHook(() => useExpenseEditor(null, palette, vi.fn()), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setSmartText("Lunch 14.25");
      result.current.parseMutation.mutate();
    });

    await waitFor(() => {
      expect(parseExpenseTextMock).toHaveBeenCalledWith("Lunch 14.25");
    });
    await waitFor(() => {
      expect(result.current.form).toMatchObject({
        amount: "14.25",
        date: "2026-04-20",
        description: "Lunch",
        categoryId: "food-id",
      });
    });
  });

  it("creates expense, invalidates related caches, and closes dialog", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    const onClose = vi.fn();
    createExpenseMock.mockResolvedValue({});

    const { result } = renderHook(() => useExpenseEditor(null, palette, onClose), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setForm({
        amount: "12.5",
        date: "2026-04-11",
        description: "  Lunch with team  ",
        categoryId: "food-id",
      });
      result.current.saveMutation.mutate();
    });

    await waitFor(() => {
      expect(createExpenseMock).toHaveBeenCalledWith({
        amount: 12.5,
        date: "2026-04-11",
        description: "Lunch with team",
        categoryId: "food-id",
      });
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["expenses"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["goals"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reports"] });
  });

  it("updates and deletes existing expense with invalidation", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    const onClose = vi.fn();
    updateExpenseMock.mockResolvedValue({});
    deleteExpenseMock.mockResolvedValue({});

    const { result } = renderHook(() => useExpenseEditor(sampleExpense, palette, onClose), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setForm({
        amount: "20",
        date: "2026-04-12",
        description: "  Updated desc  ",
        categoryId: "food-id",
      });
      result.current.saveMutation.mutate();
    });

    await waitFor(() => {
      expect(updateExpenseMock).toHaveBeenCalledWith("exp-1", {
        amount: 20,
        date: "2026-04-12",
        description: "Updated desc",
        categoryId: "food-id",
      });
    });

    act(() => {
      result.current.deleteMutation.mutate();
    });
    await waitFor(() => {
      expect(deleteExpenseMock).toHaveBeenCalledWith("exp-1");
    });

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["expenses"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["goals"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reports"] });
  });
});
