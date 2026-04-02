import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DateFilter } from "@/components/DateFilter";

describe("DateFilter", () => {
  it("calls onSelectPreset when a preset chip is clicked", async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    const onApplyRange = vi.fn();

    render(
      <DateFilter
        kind="month"
        fromDate="2026-04-01"
        toDate="2026-04-20"
        onSelectPreset={onSelectPreset}
        onApplyRange={onApplyRange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Today" }));

    expect(onSelectPreset).toHaveBeenCalledWith("day");
  });

  it("shows validation error for invalid custom range", async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    const onApplyRange = vi.fn();

    render(
      <DateFilter
        kind="month"
        fromDate="2026-04-01"
        toDate="2026-04-20"
        onSelectPreset={onSelectPreset}
        onApplyRange={onApplyRange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Date range" }));

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-04-10" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-04-01" } });
    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(screen.getByText("From must be on or before To.")).toBeInTheDocument();
    expect(onApplyRange).not.toHaveBeenCalled();
  });

  it("applies custom range from dialog", async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    const onApplyRange = vi.fn();

    render(
      <DateFilter
        kind="range"
        fromDate="2026-04-01"
        toDate="2026-04-20"
        onSelectPreset={onSelectPreset}
        onApplyRange={onApplyRange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Apr/i }));

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-04-05" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-04-22" } });
    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(onApplyRange).toHaveBeenCalledWith("2026-04-05", "2026-04-22");
  });
});
