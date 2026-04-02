import { alpha, type Theme } from "@mui/material/styles";

/**
 * Radii as px strings for use in `sx`. MUI multiplies numeric `borderRadius` by
 * `theme.shape.borderRadius`, so e.g. `16` becomes 256px — use strings instead.
 */
export const RADIUS_CARD = "10px";
export const RADIUS_INNER = "8px";
export const RADIUS_DENSE = "6px";
export const RADIUS_SHELL = "12px";
export const RADIUS_CHIP = "10px";

/** Nested panels inside a card (stat tiles, form sections) */
export const radiusInner = (_theme: Theme) => RADIUS_INNER;

export const surfaceCard = (theme: Theme) => ({
  bgcolor: alpha(theme.palette.common.white, 0.045),
  border: `1px solid ${alpha(theme.palette.common.white, 0.09)}`,
  borderRadius: RADIUS_CARD,
  boxShadow: `0 1px 0 ${alpha(theme.palette.common.white, 0.04)} inset`,
});

export const surfaceInset = (theme: Theme) => ({
  bgcolor: alpha(theme.palette.common.white, 0.04),
  borderRadius: RADIUS_INNER,
});

export const sectionLabelSx = (theme: Theme) => ({
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: theme.palette.text.secondary,
});

export const appShellGradient = (theme: Theme) => ({
  backgroundColor: theme.palette.background.default,
  backgroundImage: `
    radial-gradient(ellipse 120% 80% at 0% -20%, ${alpha(theme.palette.primary.main, 0.22)} 0%, transparent 55%),
    radial-gradient(ellipse 100% 60% at 100% 0%, ${alpha(theme.palette.secondary.main, 0.12)} 0%, transparent 50%)
  `,
});

export const listRowInteractive = (theme: Theme) => ({
  transition: theme.transitions.create(["background-color"], { duration: 180 }),
  "&:hover": {
    bgcolor: alpha(theme.palette.common.white, 0.04),
  },
  "&:active": {
    bgcolor: alpha(theme.palette.common.white, 0.06),
  },
});
