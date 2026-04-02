import { formatLocalIsoDate, formatShortDate } from "@/lib/expense-ui";

export type DateFilterKind = "day" | "week" | "month" | "range";

/** Expenses list: MTD / week-to-date / today. Reports: wider windows for chart aggregation. */
export type DateFilterScope = "expenses" | "reports";

export { formatLocalIsoDate };

const startOfMonthLocal = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Monday-start week containing `d`. */
export const mondayOfWeekLocal = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

/**
 * Reports presets (see Reports UI):
 * - `month` -> last ~6 calendar months (first day of month five months ago through today)
 * - `week`  -> this calendar year (Jan 1 through today)
 * - `day`   -> unused when the "Today" chip is hidden; kept for typing compatibility
 */
export const getReportsRangeForKind = (kind: Exclude<DateFilterKind, "range">): { from: string; to: string } => {
  const today = new Date();
  const todayIso = formatLocalIsoDate(today);

  if (kind === "day") {
    const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    return { from: formatLocalIsoDate(start), to: todayIso };
  }

  if (kind === "week") {
    const start = new Date(today.getFullYear(), 0, 1);
    return { from: formatLocalIsoDate(start), to: todayIso };
  }

  const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  return { from: formatLocalIsoDate(start), to: todayIso };
};

export const getRangeForKind = (
  kind: Exclude<DateFilterKind, "range">,
  scope: DateFilterScope = "expenses",
): { from: string; to: string } => {
  if (scope === "reports") {
    return getReportsRangeForKind(kind);
  }

  const today = new Date();
  const todayIso = formatLocalIsoDate(today);

  if (kind === "day") {
    return { from: todayIso, to: todayIso };
  }

  if (kind === "week") {
    return { from: formatLocalIsoDate(mondayOfWeekLocal(today)), to: todayIso };
  }

  return { from: formatLocalIsoDate(startOfMonthLocal(today)), to: todayIso };
};

/** Default when opening the custom range modal from a preset (not yet on custom range). */
export const getDefaultModalRange = (scope: DateFilterScope = "expenses"): { from: string; to: string } =>
  getRangeForKind("month", scope);

export const daysInclusiveInRange = (fromIso: string, toIso: string) => {
  const a = new Date(`${fromIso}T12:00:00`);
  const b = new Date(`${toIso}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)) + 1;
};

export const formatDateRangeLabel = (fromIso: string, toIso: string) => {
  if (fromIso === toIso) {
    return formatShortDate(fromIso);
  }
  return `${formatShortDate(fromIso)} – ${formatShortDate(toIso)}`;
};

export const isValidIsoRange = (from: string, to: string) => from.length === 10 && to.length === 10 && from <= to;
