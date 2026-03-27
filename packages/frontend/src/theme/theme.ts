import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4f8ff7",
    },
    secondary: {
      main: "#d7a33d",
    },
    background: {
      default: "#1a1a18",
      paper: "#111110",
    },
    text: {
      primary: "#f4f4f0",
      secondary: "#9b9b93",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1d1d1b",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "rgba(17,17,16,0.92)",
          borderRadius: 22,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          fontWeight: 700,
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
          backgroundColor: "rgba(255,255,255,0.04)",
          borderRadius: 10,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: "#8f8f88",
        },
      },
    },
  },
});
