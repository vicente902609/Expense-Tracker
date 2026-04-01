import * as chrono from "chrono-node";

const formatDate = (value: Date) => value.toISOString().slice(0, 10);

const startOfUtcDay = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

export const getIsoDate = (value = new Date()) => formatDate(startOfUtcDay(value));

/**
 * Calendar "today" as YYYY-MM-DD in the given IANA timezone (e.g. America/New_York).
 * Use for AI parsing so "yesterday" matches the user's local day, not server UTC.
 */
export const getCalendarDateInTimezone = (timezone: string, value = new Date()): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    if (y && m && d) {
      return `${y}-${m}-${d}`;
    }
  } catch {
    // invalid timezone
  }
  return getIsoDate(value);
};

export const parseNaturalDate = (input: string, referenceDate = getIsoDate()) => {
  const reference = new Date(`${referenceDate}T12:00:00.000Z`);
  const parsed = chrono.parse(input, reference, { forwardDate: false })[0];

  if (parsed) {
    const year = parsed.start.get("year");
    const month = parsed.start.get("month");
    const day = parsed.start.get("day");

    if (year && month && day) {
      const isoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return {
        isoDate,
        cleanedText: input.replace(parsed.text, "").replace(/\s+/gu, " ").trim(),
        matchedExpression: parsed.text,
      };
    }
  }

  return {
    isoDate: null,
    cleanedText: input.trim(),
    matchedExpression: null,
  };
};

export const differenceInDays = (fromIsoDate: string, toIsoDate: string) => {
  const from = new Date(`${fromIsoDate}T00:00:00.000Z`);
  const to = new Date(`${toIsoDate}T00:00:00.000Z`);
  const millisecondsInDay = 24 * 60 * 60 * 1000;

  return Math.round((to.getTime() - from.getTime()) / millisecondsInDay);
};

export const addDays = (isoDate: string, days: number) => {
  const value = new Date(`${isoDate}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return formatDate(value);
};

export const toMonthKey = (isoDate: string) => isoDate.slice(0, 7);
