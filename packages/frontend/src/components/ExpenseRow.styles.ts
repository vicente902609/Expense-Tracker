import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";

import { listRowInteractive } from "@/theme/ui";

export const RowContainer = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "$isLast",
})<{ $isLast?: boolean }>(({ theme, $isLast }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingLeft: theme.spacing(1.75),
  paddingRight: theme.spacing(1.75),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  cursor: "pointer",
  borderBottom: $isLast ? "none" : `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
  ...listRowInteractive(theme),
  [theme.breakpoints.up("sm")]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
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

export const RowAmount = styled(Typography)({
  fontWeight: 700,
  flexShrink: 0,
  marginLeft: 8,
});
