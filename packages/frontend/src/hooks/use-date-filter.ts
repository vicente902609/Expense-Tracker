import { useCallback, useState } from "react";

import { getRangeForKind, type DateFilterKind, type DateFilterScope } from "../lib/date-filter.js";

export type { DateFilterKind, DateFilterScope };

export const useDateFilter = (
  initialKind: Exclude<DateFilterKind, "range"> = "month",
  scope: DateFilterScope = "expenses",
) => {
  const initialRange = getRangeForKind(initialKind, scope);
  const [kind, setKind] = useState<DateFilterKind>(initialKind);
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);

  const selectPreset = useCallback(
    (next: Exclude<DateFilterKind, "range">) => {
      const r = getRangeForKind(next, scope);
      setFromDate(r.from);
      setToDate(r.to);
      setKind(next);
    },
    [scope],
  );

  const applyCustomRange = useCallback((from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    setKind("range");
  }, []);

  return {
    kind,
    fromDate,
    toDate,
    selectPreset,
    applyCustomRange,
  };
};
