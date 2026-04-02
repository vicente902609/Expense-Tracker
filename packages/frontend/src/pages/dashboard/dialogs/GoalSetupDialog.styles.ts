import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box, Stack } from "@mui/material";

export const DialogBody = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.98),
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
}));

export const DialogHeader = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "$borderColor",
})<{ $borderColor?: string }>(({ theme }) => ({
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

export const DialogFormContent = styled(Stack)(({ theme }) => ({
  spacing: 2,
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(3),
  },
}));
