import type { Expense } from "@expense-tracker/shared";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";

import { formatCurrency, getCategoryColor, getCategoryTotals, getDailySeries, getMonthlySeries, getWeeklySeries } from "../../lib/expense-ui.js";
import { useReportFilters } from "./hooks/use-report-filters.js";

type ReportsViewProps = {
  expenses: Expense[];
};

export const ReportsView = ({ expenses }: ReportsViewProps) => {
  const { changeMode, filteredExpenses, fromDate, mode, setFromDate, setToDate, toDate } = useReportFilters(expenses);
  const series =
    mode === "daily" || mode === "range"
      ? getDailySeries(filteredExpenses)
      : mode === "weekly"
        ? getWeeklySeries(filteredExpenses)
        : getMonthlySeries(filteredExpenses);
  const maxValue = Math.max(...series.map((entry) => entry.total), 1);
  const categoryTotals = getCategoryTotals(filteredExpenses);
  const average = series.length > 0 ? series.reduce((sum, entry) => sum + entry.total, 0) / series.length : 0;
  const total = series[series.length - 1]?.total ?? 0;

  return (
    <Stack spacing={2} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2.25, md: 3 }, maxWidth: 1100 }}>
      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>Reports</Typography>
        <Typography variant="h5">Reports</Typography>
        <Typography color="text.secondary">Daily, weekly, monthly, or custom range</Typography>
      </Box>

      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {[
            { label: "Daily", value: "daily" },
            { label: "Weekly", value: "weekly" },
            { label: "Monthly", value: "monthly" },
            { label: "Date range", value: "range" },
          ].map((item) => (
            <Button key={item.value} variant={mode === item.value ? "contained" : "outlined"} color="inherit" onClick={() => changeMode(item.value as "daily" | "weekly" | "monthly" | "range")}>
              {item.label}
            </Button>
          ))}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField type="date" label="From" value={fromDate} onChange={(event) => setFromDate(event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField type="date" label="To" value={toDate} onChange={(event) => setToDate(event.target.value)} InputLabelProps={{ shrink: true }} />
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" } }}>
      <Box sx={{ borderRadius: 3, bgcolor: "rgba(55,55,52,0.92)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>{mode} spending</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Box sx={{ height: 130, display: "flex", alignItems: "flex-end", gap: 1.2 }}>
            {series.map((entry, index) => (
              <Stack key={entry.key} sx={{ flex: 1, alignItems: "center" }} spacing={1}>
                <Box
                  sx={{
                    width: "100%",
                    height: `${Math.max((entry.total / maxValue) * 100, 12)}px`,
                    borderRadius: "6px 6px 0 0",
                    bgcolor: index === series.length - 1 ? "#4f8ff7" : "#9ec3ef",
                  }}
                />
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{entry.label}</Typography>
              </Stack>
            ))}
          </Box>
          <Typography sx={{ mt: 1.5, textAlign: "right", color: "text.secondary" }}>
            Avg {formatCurrency(average)} · Latest {formatCurrency(total)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderRadius: 3, bgcolor: "rgba(55,55,52,0.92)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>By category</Typography>
        </Box>
        <Stack spacing={1.5} sx={{ p: 2 }}>
          {categoryTotals.map((entry) => {
            const percent = total > 0 ? (entry.total / total) * 100 : 0;

            return (
              <Stack key={entry.category} direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: getCategoryColor(entry.category) }} />
                <Typography sx={{ width: 90, fontWeight: 700 }}>{entry.category}</Typography>
                <Box sx={{ flex: 1, height: 6, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)" }}>
                  <Box sx={{ width: `${Math.max(percent, 8)}%`, height: "100%", borderRadius: 999, bgcolor: getCategoryColor(entry.category) }} />
                </Box>
                <Typography sx={{ minWidth: 64, textAlign: "right", fontWeight: 800 }}>{formatCurrency(entry.total)}</Typography>
              </Stack>
            );
          })}
        </Stack>
      </Box>
      </Box>
    </Stack>
  );
};
