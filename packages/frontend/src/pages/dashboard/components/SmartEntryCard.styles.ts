import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box } from "@mui/material";

import { radiusInner, surfaceCard } from "@/theme/ui";

export const SmartEntryRoot = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.75),
  ...surfaceCard(theme),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(2),
  },
}));

export const SmartEntryPromptBox = styled(Box)(({ theme }) => ({
  flex: 1,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  borderRadius: radiusInner(theme),
  backgroundColor: alpha(theme.palette.common.white, 0.04),
  border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
}));
