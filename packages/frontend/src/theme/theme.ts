import { alpha, createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7aa3ff",
      light: "#a8c0ff",
      dark: "#4d74cc",
    },
    secondary: {
      main: "#e4b04a",
      light: "#f0c978",
      dark: "#b8892e",
    },
    error: {
      main: "#f08080",
    },
    success: {
      main: "#6ecf8f",
    },
    background: {
      default: "#0c0c0b",
      paper: "#121211",
    },
    divider: alpha("#ffffff", 0.08),
    text: {
      primary: "#f2f2ed",
      secondary: alpha("#f2f2ed", 0.58),
    },
    action: {
      hover: alpha("#ffffff", 0.06),
      selected: alpha("#7aa3ff", 0.16),
    },
  },
  shape: {
    /** Used by MuiCard/MuiDialog overrides (raw px). Avoid relying on this in `sx` — use theme/ui px strings. */
    borderRadius: 12,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif',
    fontSize: 15,
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.25,
    },
    h6: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    body1: {
      lineHeight: 1.55,
    },
    body2: {
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitTapHighlightColor: "transparent",
        },
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: `${alpha("#ffffff", 0.15)} transparent`,
        },
        "*::-webkit-scrollbar": {
          width: 8,
          height: 8,
        },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: alpha("#ffffff", 0.14),
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha("#ffffff", 0.04),
          border: `1px solid ${alpha("#ffffff", 0.08)}`,
          boxShadow: "none",
          borderRadius: theme.shape.borderRadius,
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundImage: "none",
          backgroundColor: alpha("#121211", 0.97),
          borderRadius: theme.shape.borderRadius,
          border: `1px solid ${alpha("#ffffff", 0.08)}`,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 600,
          paddingInline: 18,
          minHeight: 44,
        },
        sizeLarge: {
          minHeight: 48,
          paddingInline: 22,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#ffffff", 0.04),
          borderRadius: "10px",
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          height: "auto",
          minHeight: 64,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingTop: 4,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: alpha("#f2f2ed", 0.45),
          paddingTop: 8,
          paddingBottom: 8,
          minWidth: 0,
          maxWidth: "none",
          "&.Mui-selected": {
            color: "#7aa3ff",
          },
        },
        label: {
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
          "&.Mui-selected": {
            fontSize: "0.7rem",
          },
        },
      },
    },
  },
});
