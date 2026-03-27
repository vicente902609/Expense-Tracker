import { alpha } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";

import { formatCurrency } from "../../../lib/expense-ui.js";
import { RADIUS_DENSE, sectionLabelSx, surfaceCard } from "../../../theme/ui.js";

type BalanceSectionProps = {
  incomeTotal: number;
  currentBalance: number;
  remainingBudget: number;
  dailyBudget: number;
  daysLeft: number;
  onManageIncome: () => void;
};

export const BalanceSection = ({
  incomeTotal,
  currentBalance,
  remainingBudget,
  dailyBudget,
  daysLeft,
  onManageIncome,
}: BalanceSectionProps) => (
  <>
    <Typography sx={(theme) => ({ ...sectionLabelSx(theme), pt: 0.5 })}>Balance</Typography>

    <Box sx={(theme) => ({ p: { xs: 1.75, sm: 2 }, ...surfaceCard(theme) })}>
      <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(2, minmax(0, 1fr))" } }}>
        {[
          { label: "Income", value: formatCurrency(incomeTotal), note: "monthly income" },
          { label: "Current balance", value: formatCurrency(currentBalance), note: "saved amount" },
          { label: "Remaining budget", value: formatCurrency(remainingBudget), note: "income − spend" },
          { label: "Daily budget", value: formatCurrency(dailyBudget, true), note: `${daysLeft} days left` },
        ].map((item) => (
          <Box
            key={item.label}
            sx={(theme) => ({
              borderRadius: RADIUS_DENSE,
              p: 1.5,
              bgcolor: alpha(theme.palette.common.white, 0.04),
              border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
            })}
          >
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{item.label}</Typography>
            <Typography sx={{ mt: 0.5, fontWeight: 700, fontSize: "1.05rem" }}>{item.value}</Typography>
            <Typography sx={{ mt: 0.5, fontSize: 12, color: "text.secondary" }}>{item.note}</Typography>
          </Box>
        ))}
      </Box>

      <Button variant="outlined" onClick={onManageIncome} sx={{ mt: 2, minHeight: 44 }}>
        Manage income
      </Button>
    </Box>
  </>
);
