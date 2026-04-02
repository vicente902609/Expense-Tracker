import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box } from "@mui/material";

import { RADIUS_DENSE } from "@/theme/ui";

export const StatCardsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(1.25),
  gridTemplateColumns: "1fr",
  [theme.breakpoints.up("sm")]: {
    gap: theme.spacing(1.5),
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  },
}));

export const StatCard = styled(Box)(({ theme }) => ({
  borderRadius: RADIUS_DENSE,
  paddingLeft: theme.spacing(1.75),
  paddingRight: theme.spacing(1.75),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  minHeight: "auto",
  backgroundColor: alpha(theme.palette.common.white, 0.04),
  border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
  [theme.breakpoints.up("sm")]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.75),
    paddingBottom: theme.spacing(1.75),
    minHeight: 100,
  },
}));
