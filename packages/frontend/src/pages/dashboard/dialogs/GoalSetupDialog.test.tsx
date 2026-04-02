import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Goal } from "@/types";
import { GoalSetupDialog } from "@/pages/dashboard/dialogs/GoalSetupDialog";
import { theme } from "@/theme/theme";

const createGoalMock = vi.fn();
const updateGoalMock = vi.fn();
const deleteGoalMock = vi.fn();

vi.mock("@/api/goals", () => ({
  createGoal: (...args: unknown[]) => createGoalMock(...args),
  updateGoal: (...args: unknown[]) => updateGoalMock(...args),
  deleteGoal: (...args: unknown[]) => deleteGoalMock(...args),
}));

const renderWithQuery = (ui: React.ReactNode) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </ThemeProvider>,
  );
};

describe("GoalSetupDialog", () => {
  it("creates a goal in create mode", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    createGoalMock.mockResolvedValue({});

    renderWithQuery(<GoalSetupDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText("Name"), "My budget");
    await user.type(screen.getByLabelText("Monthly spending target"), "1200");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createGoalMock).toHaveBeenCalled();
    });
    expect(createGoalMock.mock.calls[0]?.[0]).toMatchObject({
      name: "My budget",
      targetExpense: 1200,
    });
  });

  it("updates and deletes in edit mode", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    updateGoalMock.mockResolvedValue({});
    deleteGoalMock.mockResolvedValue({});
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const existingGoal: Goal = {
      name: "Existing budget",
      targetExpense: 900,
      insight: "Stay on track",
      insightUpdatedAt: "2026-04-01T10:00:00.000Z",
      createdAt: "2026-04-01T10:00:00.000Z",
      updatedAt: "2026-04-01T10:00:00.000Z",
    };

    renderWithQuery(<GoalSetupDialog open onClose={onClose} existingGoal={existingGoal} />);

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Updated budget");
    await user.clear(screen.getByLabelText("Monthly spending target"));
    await user.type(screen.getByLabelText("Monthly spending target"), "1000");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateGoalMock).toHaveBeenCalled();
    });
    expect(updateGoalMock.mock.calls[0]?.[0]).toMatchObject({
      name: "Updated budget",
      targetExpense: 1000,
    });

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => {
      expect(deleteGoalMock).toHaveBeenCalled();
    });
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
