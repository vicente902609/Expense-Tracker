import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box, LinearProgress, Stack } from "@mui/material";

import { surfaceCard, RADIUS_INNER } from "@/theme/ui";

export const GoalCardRoot = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.75),
  ...surfaceCard(theme),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(2),
  },
}));

export const GoalStatusChip = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$bgColor" && prop !== "$textColor" && prop !== "$borderColor",
})<{ $bgColor: string; $textColor: string; $borderColor: string }>(
  ({ $bgColor, $textColor, $borderColor }) => ({
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 4,
    paddingBottom: 4,
    borderRadius: 10,
    backgroundColor: $bgColor,
    color: $textColor,
    fontSize: 12,
    fontWeight: 700,
    border: `1px solid ${$borderColor}`,
    whiteSpace: "nowrap",
    alignSelf: "flex-start",
  }),
);

export const GoalProgressBar = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== "$barColor",
})<{ $barColor: string }>(({ theme, $barColor }) => ({
  height: 10,
  borderRadius: "5px",
  backgroundColor: alpha(theme.palette.common.white, 0.08),
  "& .MuiLinearProgress-bar": {
    borderRadius: "5px",
    backgroundColor: $barColor,
  },
}));

export const GoalInsightBox = styled(Box)(({ theme }) => ({
  borderRadius: RADIUS_INNER,
  padding: theme.spacing(1.5),
  backgroundColor: alpha(theme.palette.common.white, 0.04),
  border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
}));

export const GoalChipRow = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(1.5),
  [theme.breakpoints.up("sm")]: {
    alignItems: "center",
  },
}));
