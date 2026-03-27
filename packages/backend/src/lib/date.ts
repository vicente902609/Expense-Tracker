const weekdayMap = new Map([
  ["sunday", 0],
  ["monday", 1],
  ["tuesday", 2],
  ["wednesday", 3],
  ["thursday", 4],
  ["friday", 5],
  ["saturday", 6],
]);

const formatDate = (value: Date) => value.toISOString().slice(0, 10);

const startOfUtcDay = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const shiftDays = (value: Date, days: number) => {
  const next = startOfUtcDay(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const getIsoDate = (value = new Date()) => formatDate(startOfUtcDay(value));

export const parseNaturalDate = (input: string, referenceDate = getIsoDate()) => {
  const normalized = input.toLowerCase();
  const reference = new Date(`${referenceDate}T00:00:00.000Z`);

  if (normalized.includes("today")) {
    return {
      isoDate: formatDate(reference),
      cleanedText: input.replace(/\btoday\b/giu, "").replace(/\s+/gu, " ").trim(),
      matchedExpression: "today",
    };
  }

  if (normalized.includes("yesterday")) {
    return {
      isoDate: formatDate(shiftDays(reference, -1)),
      cleanedText: input.replace(/\byesterday\b/giu, "").replace(/\s+/gu, " ").trim(),
      matchedExpression: "yesterday",
    };
  }

  if (normalized.includes("tomorrow")) {
    return {
      isoDate: formatDate(shiftDays(reference, 1)),
      cleanedText: input.replace(/\btomorrow\b/giu, "").replace(/\s+/gu, " ").trim(),
      matchedExpression: "tomorrow",
    };
  }

  const lastWeekdayMatch = normalized.match(/\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/iu);

  if (lastWeekdayMatch) {
    const weekdayName = lastWeekdayMatch[1].toLowerCase();
    const weekday = weekdayMap.get(weekdayName);

    if (weekday !== undefined) {
      const current = reference.getUTCDay();
      const offset = current > weekday ? current - weekday : current + (7 - weekday);
      const daysBack = offset === 0 ? 7 : offset;

      return {
        isoDate: formatDate(shiftDays(reference, -daysBack)),
        cleanedText: input.replace(new RegExp(`\\blast\\s+${weekdayName}\\b`, "giu"), "").replace(/\s+/gu, " ").trim(),
        matchedExpression: `last ${weekdayName}`,
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
