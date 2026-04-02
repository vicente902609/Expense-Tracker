import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

import { surfaceCard } from "@/theme/ui";

export const ExpenseListCard = styled(Box)(({ theme }) => ({
  overflow: "hidden",
  ...surfaceCard(theme),
}));

export const PageHeaderRow = styled(Box)({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: 16,
  "@media (min-width: 600px)": {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
});
