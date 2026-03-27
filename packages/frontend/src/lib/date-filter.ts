import { formatShortDate } from "./expense-ui.js";

export type DateFilterKind = "today" | "week" | "month" | "range";

/** Expenses list: MTD / week-to-date / today. Reports: wider windows for chart aggregation. */
export type DateFilterScope = "expenses" | "reports";

/** Local calendar YYYY-MM-DD (avoid UTC drift from toISOString). */
export const formatLocalIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const startOfMonthLocal = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Monday-start week containing `d`. */
export const mondayOfWeekLocal = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const sundayOfWeekLocal = (d: Date) => {
  const sun = new Date(mondayOfWeekLocal(d));
  sun.setDate(sun.getDate() + 6);
  return sun;
};

/**
 * Reports: Daily = full Mon–Sun week; Weekly = last 8 weeks (Mon-start); Monthly = last 6 calendar months (incl. current).
 */
export const getReportsRangeForKind = (kind: Exclude<DateFilterKind, "range">): { from: string; to: string } => {
  const today = new Date();
  const todayIso = formatLocalIsoDate(today);

  if (kind === "today") {
    const mon = mondayOfWeekLocal(today);
    const sun = sundayOfWeekLocal(today);
    return { from: formatLocalIsoDate(mon), to: formatLocalIsoDate(sun) };
  }

  if (kind === "week") {
    const monThis = mondayOfWeekLocal(today);
    const sunEnd = sundayOfWeekLocal(today);
    const monStart = new Date(monThis.getFullYear(), monThis.getMonth(), monThis.getDate() - 7 * 7);
    return { from: formatLocalIsoDate(monStart), to: formatLocalIsoDate(sunEnd) };
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

  if (kind === "today") {
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
