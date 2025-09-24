"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#0ea5ff" },         
    secondary: { main: "#7c3aed" },        
    background: { default: "#0b1220", paper: "rgba(13,23,42,0.6)" },
    text: { primary: "#e6f1ff", secondary: "#94a3b8" }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ["Inter","Roboto","system-ui","Segoe UI","Arial"].join(","),
    h1: { fontWeight: 800, letterSpacing: -0.5 },
    h2: { fontWeight: 800, letterSpacing: -0.4 },
    h3: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 }
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(148,163,184,0.12)",
          backdropFilter: "blur(8px)",
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
        }
      }
    },
    MuiButton: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(7,12,24,0.6)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(148,163,184,0.12)"
        }
      }
    }
  }
});
