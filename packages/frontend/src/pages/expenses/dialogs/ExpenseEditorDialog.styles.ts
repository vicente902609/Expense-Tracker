import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/material";

export const DialogHeader = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
  [theme.breakpoints.up("sm")]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(2.5),
  },
}));

export const AiBadge = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  paddingTop: "2.8px",
  paddingBottom: "2.8px",
  borderRadius: 10,
  backgroundColor: alpha(theme.palette.primary.main, 0.2),
  color: theme.palette.primary.light,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
}));
