import { createTheme } from "@mui/material/styles";

const lightShadows = [
  "none",
  "0 1px 2px rgba(15, 23, 42, 0.04)",
  "0 2px 4px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03)",
  "0 4px 6px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
  "0 6px 10px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -2px rgba(15, 23, 42, 0.04)",
  "0 8px 12px -4px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.04)",
  "0 12px 16px -4px rgba(15, 23, 42, 0.07), 0 4px 8px -2px rgba(15, 23, 42, 0.04)",
  "0 16px 24px -4px rgba(15, 23, 42, 0.08), 0 6px 10px -2px rgba(15, 23, 42, 0.04)",
  "0 20px 28px -4px rgba(15, 23, 42, 0.08), 0 8px 12px -2px rgba(15, 23, 42, 0.05)",
  "0 24px 32px -4px rgba(15, 23, 42, 0.09), 0 10px 14px -2px rgba(15, 23, 42, 0.05)",
  "0 28px 36px -4px rgba(15, 23, 42, 0.1), 0 12px 16px -2px rgba(15, 23, 42, 0.05)",
  "0 32px 40px -4px rgba(15, 23, 42, 0.1), 0 14px 18px -2px rgba(15, 23, 42, 0.05)",
  "0 36px 44px -4px rgba(15, 23, 42, 0.11), 0 16px 20px -2px rgba(15, 23, 42, 0.05)",
  "0 40px 48px -4px rgba(15, 23, 42, 0.11), 0 18px 22px -2px rgba(15, 23, 42, 0.05)",
  "0 44px 52px -4px rgba(15, 23, 42, 0.12), 0 20px 24px -2px rgba(15, 23, 42, 0.06)",
  "0 48px 56px -4px rgba(15, 23, 42, 0.12), 0 22px 26px -2px rgba(15, 23, 42, 0.06)",
  "0 52px 60px -4px rgba(15, 23, 42, 0.13), 0 24px 28px -2px rgba(15, 23, 42, 0.06)",
  "0 56px 64px -4px rgba(15, 23, 42, 0.13), 0 26px 30px -2px rgba(15, 23, 42, 0.06)",
  "0 60px 68px -4px rgba(15, 23, 42, 0.14), 0 28px 32px -2px rgba(15, 23, 42, 0.06)",
  "0 64px 72px -4px rgba(15, 23, 42, 0.14), 0 30px 34px -2px rgba(15, 23, 42, 0.07)",
  "0 68px 76px -4px rgba(15, 23, 42, 0.15), 0 32px 36px -2px rgba(15, 23, 42, 0.07)",
  "0 72px 80px -4px rgba(15, 23, 42, 0.15), 0 34px 38px -2px rgba(15, 23, 42, 0.07)",
  "0 76px 84px -4px rgba(15, 23, 42, 0.16), 0 36px 40px -2px rgba(15, 23, 42, 0.07)",
  "0 80px 88px -4px rgba(15, 23, 42, 0.16), 0 38px 42px -2px rgba(15, 23, 42, 0.08)",
  "0 84px 92px -4px rgba(15, 23, 42, 0.17), 0 40px 44px -2px rgba(15, 23, 42, 0.08)",
];

const typography = {
  fontFamily: '"Plus Jakarta Sans", "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  h1: {
    fontWeight: 700,
    fontSize: "2.25rem",
    lineHeight: 1.25,
    letterSpacing: "-0.025em",
  },
  h2: {
    fontWeight: 700,
    fontSize: "1.875rem",
    lineHeight: 1.3,
    letterSpacing: "-0.02em",
  },
  h3: {
    fontWeight: 600,
    fontSize: "1.5rem",
    lineHeight: 1.35,
    letterSpacing: "-0.015em",
  },
  h4: {
    fontWeight: 600,
    fontSize: "1.25rem",
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 600,
    fontSize: "1.125rem",
    lineHeight: 1.45,
    letterSpacing: "-0.01em",
  },
  h6: {
    fontWeight: 600,
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  body1: {
    fontSize: { xs: "0.875rem", sm: "0.9rem", md: "0.9375rem", lg: "1rem" },
    lineHeight: 1.6,
    letterSpacing: "0.01em",
  },
  body2: {
    fontSize: { xs: "0.8125rem", sm: "0.85rem", md: "0.875rem", lg: "0.9375rem" },
    lineHeight: 1.55,
    letterSpacing: "0.01em",
  },
  button: {
    fontWeight: 600,
    fontSize: "0.875rem",
    letterSpacing: "0.02em",
    textTransform: "none",
  },
  caption: {
    fontSize: "0.8125rem",
    lineHeight: 1.5,
    letterSpacing: "0.02em",
  },
};

function lightPalette() {
  return {
    mode: "light",
    primary: {
      main: "#0D9488",
      light: "#14B8A6",
      dark: "#0F766E",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#475569",
      light: "#64748B",
      dark: "#334155",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#059669",
      light: "#10B981",
      dark: "#047857",
      lighter: "#D1FAE5",
    },
    error: {
      main: "#DC2626",
      light: "#EF4444",
      dark: "#B91C1C",
      lighter: "#FEE2E2",
    },
    warning: {
      main: "#D97706",
      light: "#F59E0B",
      dark: "#B45309",
      lighter: "#FEF3C7",
    },
    info: {
      main: "#0284C7",
      light: "#0EA5E9",
      dark: "#0369A1",
      lighter: "#E0F2FE",
    },
    background: {
      default: "#F1F5F9",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
      disabled: "#94A3B8",
    },
    grey: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
    divider: "rgba(15, 23, 42, 0.08)",
  };
}

function darkPalette() {
  return {
    mode: "dark",
    primary: {
      main: "#2DD4BF",
      light: "#5EEAD4",
      dark: "#14B8A6",
      contrastText: "#0F172A",
    },
    secondary: {
      main: "#94A3B8",
      light: "#CBD5E1",
      dark: "#64748B",
      contrastText: "#0F172A",
    },
    success: {
      main: "#34D399",
      light: "#6EE7B7",
      dark: "#10B981",
      lighter: "rgba(16, 185, 129, 0.2)",
    },
    error: {
      main: "#F87171",
      light: "#FCA5A5",
      dark: "#EF4444",
      lighter: "rgba(248, 113, 113, 0.18)",
    },
    warning: {
      main: "#FBBF24",
      light: "#FCD34D",
      dark: "#F59E0B",
      lighter: "rgba(251, 191, 36, 0.2)",
    },
    info: {
      main: "#38BDF8",
      light: "#7DD3FC",
      dark: "#0EA5E9",
      lighter: "rgba(56, 189, 248, 0.18)",
    },
    background: {
      default: "#0F172A",
      paper: "#1E293B",
    },
    text: {
      primary: "#F1F5F9",
      secondary: "#94A3B8",
      disabled: "#64748B",
    },
    grey: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
    divider: "rgba(148, 163, 184, 0.14)",
  };
}

const components = {
  MuiButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.875rem",
        padding: "10px 20px",
        boxShadow: "none",
        transition:
          "background-color 0.18s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
        "&:hover": {
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 2px 12px rgba(45, 212, 191, 0.22)"
              : "0 2px 8px rgba(13, 148, 136, 0.2)",
          transform: "scale(1.02)",
        },
        "&:active": {
          transform: "scale(0.98)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 1px 6px rgba(45, 212, 191, 0.18)"
              : "0 1px 4px rgba(13, 148, 136, 0.15)",
        },
        "&.MuiLoadingButton-loading": {
          "& .MuiButton-startIcon, & .MuiButton-endIcon": { opacity: 0.6 },
        },
      }),
      contained: ({ theme }) => ({
        "&:hover": {
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 4px 16px rgba(45, 212, 191, 0.28)"
              : "0 4px 12px rgba(13, 148, 136, 0.25)",
          transform: "scale(1.02)",
        },
      }),
      outlined: ({ theme }) => ({
        borderWidth: "1.5px",
        "&:hover": {
          borderWidth: "1.5px",
          backgroundColor:
            theme.palette.mode === "dark" ? "rgba(45, 212, 191, 0.1)" : "rgba(13, 148, 136, 0.04)",
          transform: "scale(1.02)",
        },
      }),
      text: ({ theme }) => ({
        "&:hover": {
          backgroundColor:
            theme.palette.mode === "dark" ? "rgba(45, 212, 191, 0.12)" : "rgba(13, 148, 136, 0.06)",
        },
      }),
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        border: `1px solid ${theme.palette.divider}`,
        backgroundImage: "none",
      }),
      elevation1: ({ theme }) => ({
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 2px 8px rgba(0, 0, 0, 0.35)"
            : "0 2px 4px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03)",
      }),
      elevation2: ({ theme }) => ({
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 4px 12px rgba(0, 0, 0, 0.4)"
            : "0 4px 6px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
      }),
      elevation3: ({ theme }) => ({
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 8px 20px rgba(0, 0, 0, 0.45)"
            : "0 8px 12px -4px rgba(15, 23, 42, 0.06), 0 4px 8px -2px rgba(15, 23, 42, 0.04)",
      }),
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        border: `1px solid ${theme.palette.divider}`,
        backgroundImage: "none",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 2px 8px rgba(0, 0, 0, 0.32)"
            : "0 2px 4px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03)",
        transition:
          "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease, border-color 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px) scale(1.008)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 12px 28px rgba(0, 0, 0, 0.5)"
              : "0 8px 20px -6px rgba(15, 23, 42, 0.08), 0 4px 10px -4px rgba(15, 23, 42, 0.05)",
          borderColor: theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.22)" : "rgba(15, 23, 42, 0.1)",
        },
      }),
    },
  },
  MuiTable: {
    styleOverrides: {
      root: {
        borderCollapse: "separate",
        borderSpacing: 0,
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: "12px 16px",
        fontSize: "0.875rem",
      }),
      head: ({ theme }) => ({
        fontWeight: 600,
        backgroundColor:
          theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.96)" : "rgba(248, 250, 252, 0.9)",
        color: theme.palette.text.primary,
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }),
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: ({ theme }) => ({
        "&:hover": {
          backgroundColor: theme.palette.mode === "dark" ? "rgba(45, 212, 191, 0.06)" : "rgba(13, 148, 136, 0.03)",
        },
        "&.Mui-selected": {
          backgroundColor: theme.palette.mode === "dark" ? "rgba(45, 212, 191, 0.1)" : "rgba(13, 148, 136, 0.06)",
          "&:hover": {
            backgroundColor: theme.palette.mode === "dark" ? "rgba(45, 212, 191, 0.14)" : "rgba(13, 148, 136, 0.09)",
          },
        },
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
        fontSize: "0.75rem",
        height: "26px",
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: ({ theme }) => ({
        "& .MuiOutlinedInput-root": {
          borderRadius: 8,
          transition: "box-shadow 0.2s ease, border-color 0.18s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
            borderWidth: "1.5px",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
            borderWidth: "2px",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 0 0 3px rgba(45, 212, 191, 0.2)"
                : "0 0 0 3px rgba(13, 148, 136, 0.12)",
          },
          "&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline": {
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 0 0 3px rgba(248, 113, 113, 0.2)"
                : "0 0 0 3px rgba(220, 38, 38, 0.12)",
          },
        },
      }),
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: 500,
        fontSize: "0.875rem",
        minHeight: 48,
        transition: "color 0.18s ease",
        "&.Mui-selected": {
          fontWeight: 600,
        },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        transition: "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), width 0.22s ease",
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        transition: "background-color 0.18s ease, transform 0.1s ease",
        "&:hover": {
          backgroundColor: theme.palette.mode === "dark" ? "rgba(45, 212, 191, 0.12)" : "rgba(13, 148, 136, 0.08)",
        },
        "&:active": {
          transform: "scale(0.97)",
        },
      }),
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) => ({
        boxShadow:
          theme.palette.mode === "dark" ? "0 1px 3px rgba(0, 0, 0, 0.45)" : "0 1px 3px rgba(15, 23, 42, 0.06)",
      }),
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRight: `1px solid ${theme.palette.divider}`,
        transition: "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.22s ease",
      }),
    },
  },
  MuiModal: {
    styleOverrides: {
      root: {
        "& .MuiBackdrop-root": {
          transition: "opacity 0.2s ease",
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        transition: "opacity 0.2s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        transition: "opacity 0.15s ease, transform 0.15s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        transition: "opacity 0.15s ease, transform 0.15s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        transition: "transform 0.1s ease",
        "&:active .MuiSwitch-thumb": {
          transform: "scale(0.98)",
        },
      },
      switchBase: {
        transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), left 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: {
        transition: "color 0.18s ease, transform 0.1s ease",
        "&:active": {
          transform: "scale(0.95)",
        },
      },
    },
  },
};

/**
 * @param {'light' | 'dark'} mode
 */
export function buildAppTheme(mode) {
  const isDark = mode === "dark";
  const palette = isDark ? darkPalette() : lightPalette();

  const themeOptions = {
    palette,
    typography,
    shape: { borderRadius: 8 },
    spacing: 8,
    components,
  };

  if (!isDark) {
    themeOptions.shadows = lightShadows;
  }

  return createTheme(themeOptions);
}
