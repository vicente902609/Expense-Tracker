import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box, Chip, Stack } from "@mui/material";

import { listRowInteractive, RADIUS_INNER, surfaceCard } from "@/theme/ui";

export const CategoriesCard = styled(Box)(({ theme }) => ({
  overflow: "hidden",
  ...surfaceCard(theme),
}));

export const CardHeaderRow = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(1.75),
  paddingRight: theme.spacing(1.75),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
  [theme.breakpoints.up("sm")]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

export const CategoryRow = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: theme.spacing(1.75),
  paddingBottom: theme.spacing(1.75),
  borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
  ...listRowInteractive(theme),
  "@media (max-width: 600px)": {
    flexDirection: "column",
    alignItems: "stretch",
    gap: theme.spacing(1.25),
  },
}));

export const CategoryBadge = styled(Chip)(({ theme }) => ({
  height: 26,
  fontWeight: 600,
  fontSize: 11,
  backgroundColor: alpha(theme.palette.common.white, 0.08),
  border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
}));

export const ColorPickerInput = styled("input", {
  shouldForwardProp: (prop) => prop !== "$hex",
})<{ $hex?: string }>(({ $hex }) => ({
  width: 28,
  height: 28,
  padding: 0,
  border: "none",
  borderRadius: RADIUS_INNER,
  cursor: "pointer",
  flexShrink: 0,
  backgroundColor: $hex ?? "transparent",
  "&::-webkit-color-swatch-wrapper": { padding: 0 },
  "&::-webkit-color-swatch": { border: "none", borderRadius: RADIUS_INNER },
}));
