import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { alpha } from "@mui/material/styles";
import { Box, CircularProgress, Stack, Tooltip, Typography } from "@mui/material";

import { fetchByCategoryReport, fetchMonthlyReport } from "@/api/reports";
import { DateFilter } from "@/components/DateFilter";
import { useDateFilter } from "@/hooks/use-date-filter";
import { formatDateRangeLabel, type DateFilterKind } from "@/lib/date-filter";
import {
  type CategoryPaletteEntry,
  type ChartSeriesPoint,
  formatCurrency,
  formatMonthLabel,
  getCategoryColor,
  getCategoryLabel,
} from "@/lib/expense-ui";
import { RADIUS_DENSE, sectionLabelSx, surfaceCard } from "@/theme/ui";

type ReportsViewProps = {
  categoryPalette: readonly CategoryPaletteEntry[];
};

const chartTitleForKind = (kind: DateFilterKind) => {
  if (kind === "month") {
    return "Last 6 months";
  }
  if (kind === "week") {
    return "This year";
  }
  if (kind === "range") {
    return "Custom range";
  }
  return "Selected range";
};

export const ReportsView = ({ categoryPalette }: ReportsViewProps) => {
  const { applyCustomRange, fromDate, kind, selectPreset, toDate } = useDateFilter("month", "reports");

  const monthlyQuery = useQuery({
    queryKey: ["reports", "monthly", fromDate, toDate],
    queryFn: () => fetchMonthlyReport(fromDate, toDate),
    placeholderData: keepPreviousData,
  });

  const byCategoryQuery = useQuery({
    queryKey: ["reports", "by-category", fromDate, toDate],
    queryFn: () => fetchByCategoryReport(fromDate, toDate),
    placeholderData: keepPreviousData,
  });

  const series: ChartSeriesPoint[] = useMemo(() => {
    const months = monthlyQuery.data?.months ?? [];
    return months.map((m) => ({
      key: m.month,
      label: formatMonthLabel(`${m.month}-01`),
      total: m.total,
    }));
  }, [monthlyQuery.data]);

  const periodTotal = useMemo(() => series.reduce((sum, entry) => sum + entry.total, 0), [series]);
  const bucketLabel = "month";
  const maxValue = Math.max(...series.map((entry) => entry.total), 1);
  const averagePerBucket = series.length > 0 ? periodTotal / series.length : 0;

  const categoryRows = byCategoryQuery.data?.categories ?? [];

  const loadingInitial =
    (monthlyQuery.isPending && monthlyQuery.data === undefined) ||
    (byCategoryQuery.isPending && byCategoryQuery.data === undefined);

  const queryError = monthlyQuery.error ?? byCategoryQuery.error;

  if (loadingInitial) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

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
            Last 6 months or this year — or pick a custom range. Monthly and category totals are loaded from the server.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
            Showing {formatDateRangeLabel(fromDate, toDate)}
          </Typography>
        </Box>

        <DateFilter
          align="right"
          fromDate={fromDate}
          kind={kind}
          labels={{ week: "This year", month: "Last 6 months", range: "Date range" }}
          presetVisibility={{ today: false, week: true, month: true }}
          scope="reports"
          toDate={toDate}
          onApplyRange={applyCustomRange}
          onSelectPreset={selectPreset}
        />
      </Box>

      {queryError ? (
        <Typography color="error">Could not load reports. Try again or check your connection.</Typography>
      ) : null}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" } }}>
        <Box sx={(theme) => ({ overflow: "hidden", ...surfaceCard(theme) })}>
          <Box sx={(theme) => ({ p: 2, borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}` })}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "text.secondary", textTransform: "uppercase" }}>
              {chartTitleForKind(kind)} · spending by month
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
            {categoryRows.length === 0 ? (
              <Typography sx={{ py: 1, color: "text.secondary" }}>No category data in this range.</Typography>
            ) : null}
            {categoryRows.map((row) => {
              const label = getCategoryLabel(row.categoryId, categoryPalette);
              const percent = periodTotal > 0 ? (row.total / periodTotal) * 100 : 0;

              return (
                <Stack key={row.categoryId} direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: getCategoryColor(row.categoryId, categoryPalette) }}
                  />
                  <Typography sx={{ width: { xs: 72, sm: 100 }, fontWeight: 600, fontSize: 14, flexShrink: 0 }} noWrap>
                    {label}
                  </Typography>
                  <Box sx={(theme) => ({ flex: 1, height: 6, borderRadius: "4px", bgcolor: alpha(theme.palette.common.white, 0.08), minWidth: 0 })}>
                    <Box
                      sx={{ width: `${Math.max(percent, 2)}%`, height: "100%", borderRadius: "4px", bgcolor: getCategoryColor(row.categoryId, categoryPalette) }}
                    />
                  </Box>
                  <Typography sx={{ minWidth: 72, textAlign: "right", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{formatCurrency(row.total)}</Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
};
