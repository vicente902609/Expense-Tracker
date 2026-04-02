import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box } from "@mui/material";

import { appShellGradient, RADIUS_INNER, RADIUS_SHELL } from "@/theme/ui";

export const AuthRoot = styled(Box)(({ theme }) => ({
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.up("sm")]: {
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(6),
  },
  ...appShellGradient(theme),
}));

export const AuthCard = styled(Box)(({ theme }) => ({
  borderRadius: RADIUS_SHELL,
  padding: theme.spacing(2.5),
  backgroundColor: alpha(theme.palette.background.paper, 0.85),
  backdropFilter: "blur(16px)",
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  boxShadow: `0 32px 80px ${alpha("#000000", 0.5)}`,
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(3.5),
  },
}));

export const AuthIconBox = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  display: "grid",
  placeItems: "center",
  borderRadius: RADIUS_INNER,
  backgroundColor: alpha(theme.palette.primary.main, 0.2),
  color: theme.palette.primary.light,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
}));
