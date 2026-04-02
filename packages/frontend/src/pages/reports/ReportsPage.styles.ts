import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/material";

import { RADIUS_DENSE, surfaceCard } from "@/theme/ui";

export const ReportsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(2),
  gridTemplateColumns: "1fr",
  [theme.breakpoints.up("lg")]: {
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  },
}));

export const ChartCard = styled(Box)(({ theme }) => ({
  overflow: "hidden",
  ...surfaceCard(theme),
}));

export const ChartCardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
}));

export const ChartBar = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$isActive" && prop !== "$heightPx",
})<{ $isActive: boolean; $heightPx: number }>(({ theme, $isActive, $heightPx }) => ({
  width: "100%",
  maxWidth: 48,
  height: $heightPx,
  borderTopLeftRadius: RADIUS_DENSE,
  borderTopRightRadius: RADIUS_DENSE,
  borderBottomLeftRadius: "3px",
  borderBottomRightRadius: "3px",
  backgroundColor: $isActive
    ? theme.palette.primary.main
    : alpha(theme.palette.primary.main, $heightPx <= 3 ? 0.22 : 0.4),
}));

export const CategoryBarTrack = styled(Box)(({ theme }) => ({
  flex: 1,
  height: 6,
  borderRadius: "4px",
  backgroundColor: alpha(theme.palette.common.white, 0.08),
  minWidth: 0,
}));

export const CategoryBarFill = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$percent" && prop !== "$color",
})<{ $percent: number; $color: string }>(({ $percent, $color }) => ({
  width: `${Math.max($percent, 2)}%`,
  height: "100%",
  borderRadius: "4px",
  backgroundColor: $color,
}));

export const CategoryDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$color",
})<{ $color: string }>(({ $color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  flexShrink: 0,
  backgroundColor: $color,
}));

export const PageHeaderRow = styled(Stack)(({ theme }) => ({
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing(2.5),
  },
}));
