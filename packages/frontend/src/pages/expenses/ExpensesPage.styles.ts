import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box, Chip } from "@mui/material";

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

export const CategoryFilterChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "$accentColor",
})<{ $accentColor?: string }>(({ theme, $accentColor }) => ({
  flexShrink: 0,
  minHeight: 40,
  fontWeight: 600,
  "&.MuiChip-colorDefault": {
    borderColor: alpha(theme.palette.common.white, 0.15),
    backgroundColor: alpha("#ffffff", 0.04),
  },
  ...$accentColor
    ? {
        borderLeft: `3px solid ${$accentColor}`,
        paddingLeft: theme.spacing(1.25),
        "& .MuiChip-label": {
          paddingLeft: theme.spacing(1.5),
          paddingRight: theme.spacing(1.5),
        },
      }
    : {
        "& .MuiChip-label": {
          paddingLeft: theme.spacing(1.5),
          paddingRight: theme.spacing(1.5),
        },
      },
}));
