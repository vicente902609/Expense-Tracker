import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

import { surfaceCard } from "@/theme/ui";

export const RecentExpensesList = styled(Box)(({ theme }) => ({
  overflow: "hidden",
  ...surfaceCard(theme),
}));
