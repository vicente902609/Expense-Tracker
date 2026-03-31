import { useMemo } from "react";
import type { Expense } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Box, Stack, Tooltip, Typography } from "@mui/material";

import { DateFilter } from "../../components/DateFilter.js";
import { useDateFilter } from "../../hooks/use-date-filter.js";
import { daysInclusiveInRange, formatDateRangeLabel, type DateFilterKind } from "../../lib/date-filter.js";
import {
  type ChartSeriesPoint,
  formatCurrency,
  getCategoryColor,
  getCategoryTotals,
  getDailySeriesForRange,
  getMonthlySeries,
  getMonthlySeriesForRange,
  getWeeklySeriesForRange,
} from "../../lib/expense-ui.js";
import { RADIUS_DENSE, sectionLabelSx, surfaceCard } from "../../theme/ui.js";

type ReportsViewProps = {
  expenses: Expense[];
};

const chartTitleForKind = (kind: DateFilterKind) => {
  if (kind === "today") {
    return "Daily";
  }
  if (kind === "week") {
    return "Weekly";
  }
  if (kind === "month") {
    return "Monthly";
  }
  return "Range";
};

type SeriesResult = {
  series: ChartSeriesPoint[];
  bucketLabel: string;
};

const buildReportSeries = (kind: DateFilterKind, filtered: Expense[], fromIso: string, toIso: string): SeriesResult => {
  if (kind === "today") {
    return { series: getDailySeriesForRange(filtered, fromIso, toIso), bucketLabel: "day" };
  }
  if (kind === "week") {
    return { series: getWeeklySeriesForRange(filtered, fromIso, toIso), bucketLabel: "week" };
  }
  if (kind === "month") {
    return { series: getMonthlySeries(filtered), bucketLabel: "month" };
  }

  const days = daysInclusiveInRange(fromIso, toIso);
  const from = new Date(`${fromIso}T12:00:00`);
  const to = new Date(`${toIso}T12:00:00`);
  const twoMonthsAfterFrom = new Date(from.getFullYear(), from.getMonth() + 2, from.getDate(), 12, 0, 0);
  const isAboveTwoMonths = to > twoMonthsAfterFrom;

  if (days < 14) {
    return { series: getDailySeriesForRange(filtered, fromIso, toIso), bucketLabel: "day" };
  }
  if (!isAboveTwoMonths) {
    return { series: getWeeklySeriesForRange(filtered, fromIso, toIso), bucketLabel: "week" };
  }
  return { series: getMonthlySeriesForRange(filtered, fromIso, toIso), bucketLabel: "month" };
};

export const ReportsView = ({ expenses }: ReportsViewProps) => {
  const { applyCustomRange, fromDate, kind, selectPreset, toDate } = useDateFilter("month", "reports");

  const filteredExpenses = useMemo(
    () => expenses.filter((expense) => expense.date >= fromDate && expense.date <= toDate),
    [expenses, fromDate, toDate],
  );

  const { series, bucketLabel } = useMemo(
    () => buildReportSeries(kind, filteredExpenses, fromDate, toDate),
    [kind, filteredExpenses, fromDate, toDate],
  );

  const maxValue = Math.max(...series.map((entry) => entry.total), 1);
  const categoryTotals = getCategoryTotals(filteredExpenses);
  const periodTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averagePerBucket = series.length > 0 ? periodTotal / series.length : 0;

  return (
    <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "flex-start" },
          gap: { xs: 2, sm: 2.5 },
        }}
      >
        <Box sx={{ minWidth: 0, flex: { sm: "1 1 0%" } }}>
          <Typography sx={(theme) => sectionLabelSx(theme)}>Reports</Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>
            Spending insights
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Compare daily, weekly, monthly, or custom ranges
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
            Showing {formatDateRangeLabel(fromDate, toDate)}
          </Typography>
        </Box>

        <DateFilter
          align="right"
          fromDate={fromDate}
          kind={kind}
          labels={{ today: "Daily", week: "Weekly", month: "Monthly", range: "Date range" }}
          scope="reports"
          toDate={toDate}
          onApplyRange={applyCustomRange}
          onSelectPreset={selectPreset}
        />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" } }}>
        <Box sx={(theme) => ({ overflow: "hidden", ...surfaceCard(theme) })}>
          <Box sx={(theme) => ({ p: 2, borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}` })}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "text.secondary", textTransform: "uppercase" }}>
              {chartTitleForKind(kind)} · chart
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            {series.length === 0 ? (
              <Typography sx={{ py: 2, color: "text.secondary" }}>No expenses in this date range.</Typography>
            ) : (
              <Box sx={{ height: { xs: 120, sm: 140 }, display: "flex", alignItems: "flex-end", gap: { xs: 0.75, sm: 1.2 } }}>
                {series.map((entry, index) => {
                  const isZero = entry.total <= 0;
                  const barHeight = isZero ? 3 : Math.max((entry.total / maxValue) * 100, 8);
                  return (
                    <Stack key={entry.key} sx={{ flex: 1, minWidth: 0, alignItems: "center" }} spacing={1}>
                      <Tooltip title={`${entry.label}: ${formatCurrency(entry.total)}`} arrow>
                        <Box
                          sx={(theme) => ({
                            width: "100%",
                            maxWidth: 48,
                            height: `${barHeight}px`,
                            borderTopLeftRadius: RADIUS_DENSE,
                            borderTopRightRadius: RADIUS_DENSE,
                            borderBottomLeftRadius: "3px",
                            borderBottomRightRadius: "3px",
                            bgcolor: isZero
                              ? alpha(theme.palette.primary.main, 0.22)
                              : index === series.length - 1
                                ? theme.palette.primary.main
                                : alpha(theme.palette.primary.main, 0.4),
                          })}
                        />
                      </Tooltip>
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", lineHeight: 1.2 }}>
                        {entry.label}
                      </Typography>
                    </Stack>
                  );
                })}
              </Box>
            )}
            <Typography variant="body2" sx={{ mt: 1.5, textAlign: "right", color: "text.secondary" }}>
              Total {formatCurrency(periodTotal)} · Avg {formatCurrency(averagePerBucket)} per {bucketLabel}
            </Typography>
          </Box>
        </Box>

        <Box sx={(theme) => ({ overflow: "hidden", ...surfaceCard(theme) })}>
          <Box sx={(theme) => ({ p: 2, borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}` })}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "text.secondary", textTransform: "uppercase" }}>
              By category
            </Typography>
          </Box>
          <Stack spacing={1.5} sx={{ p: 2 }}>
            {categoryTotals.length === 0 ? (
              <Typography sx={{ py: 1, color: "text.secondary" }}>No category data in this range.</Typography>
            ) : null}
            {categoryTotals.map((entry) => {
              const percent = periodTotal > 0 ? (entry.total / periodTotal) * 100 : 0;

              return (
                <Stack key={entry.category} direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: getCategoryColor(entry.category) }} />
                  <Typography sx={{ width: { xs: 72, sm: 100 }, fontWeight: 600, fontSize: 14, flexShrink: 0 }} noWrap>
                    {entry.category}
                  </Typography>
                  <Box sx={(theme) => ({ flex: 1, height: 6, borderRadius: "4px", bgcolor: alpha(theme.palette.common.white, 0.08), minWidth: 0 })}>
                    <Box sx={{ width: `${Math.max(percent, 2)}%`, height: "100%", borderRadius: "4px", bgcolor: getCategoryColor(entry.category) }} />
                  </Box>
                  <Typography sx={{ minWidth: 72, textAlign: "right", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{formatCurrency(entry.total)}</Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
};
