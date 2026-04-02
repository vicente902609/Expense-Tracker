import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box } from "@mui/material";

import { appShellGradient, RADIUS_SHELL } from "@/theme/ui";

export const LayoutRoot = styled(Box)(({ theme }) => ({
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  ...appShellGradient(theme),
}));

export const LayoutContent = styled(Box)(({ theme }) => ({
  flex: 1,
  width: "100%",
  maxWidth: 1280,
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: theme.spacing(1.25),
  paddingRight: theme.spacing(1.25),
  paddingTop: theme.spacing(1.25),
  paddingBottom: theme.spacing(1.25),
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  [theme.breakpoints.up("sm")]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  [theme.breakpoints.up("md")]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(2.5),
  },
}));

export const ContentCard = styled(Box)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  borderRadius: RADIUS_SHELL,
  overflow: "hidden",
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
  boxShadow: `0 24px 80px ${alpha("#000000", 0.45)}, 0 0 0 1px ${alpha("#ffffff", 0.03)} inset`,
}));

export const ScrollableContent = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
  "@media (min-width: 1280px)": {
    paddingBottom: 0,
  },
});

export const DesktopTabBar = styled(Box)(({ theme }) => ({
  display: "none",
  [theme.breakpoints.up("lg")]: {
    display: "flex",
  },
  flexWrap: "wrap",
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  borderRadius: RADIUS_SHELL,
  backgroundColor: alpha(theme.palette.common.white, 0.05),
  border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
}));

export const MobileBottomBar = styled(Box)(({ theme }) => ({
  display: "block",
  [theme.breakpoints.up("lg")]: {
    display: "none",
  },
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  borderTop: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.92),
  backdropFilter: "blur(14px)",
  boxShadow: `0 -8px 32px ${alpha("#000000", 0.35)}`,
}));

export const LoadingContainer = styled(Box)(({ theme }) => ({
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  ...appShellGradient(theme),
}));

export const AppHeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
  flexShrink: 0,
  [theme.breakpoints.up("sm")]: {
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
}));
