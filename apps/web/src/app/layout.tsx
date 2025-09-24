"use client";

import * as React from "react";
import Link from "next/link";
import {
  ThemeProvider, CssBaseline, Container, Box, AppBar, Toolbar, Typography, Stack, Chip, Tooltip
} from "@mui/material";
import { theme } from "@/theme/theme";

function StatusBadge() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL!;
  const [ok, setOk] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${apiBase}/health`, { cache: "no-store" });
        setOk(r.ok);
      } catch {
        setOk(false);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [apiBase]);

  return (
    <Tooltip title={ok === null ? "Verificando..." : ok ? "API Online" : "API Offline"}>
      <Chip
        label={ok === null ? "..." : ok ? "Online" : "Offline"}
        size="small"
        sx={{
          bgcolor: ok === null ? "grey.700" : ok ? "success.main" : "error.main",
          color: "white",
        }}
      />
    </Tooltip>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <Box
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: -1,
              background:
                "radial-gradient(1200px 600px at 10% -20%, rgba(14,165,255,0.25), transparent 60%)," +
                "radial-gradient(900px 500px at 120% 10%, rgba(124,58,237,0.22), transparent 60%)," +
                "linear-gradient(180deg, rgba(11,18,32,0.8), rgba(11,18,32,1))",
            }}
          />
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: -1,
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 24px)," +
                "repeating-linear-gradient(90deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 24px)",
            }}
          />

          <AppBar position="sticky" elevation={0}>
            <Toolbar sx={{ justifyContent: "space-between" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg,#0ea5ff, #7c3aed)"
                  }}
                />
                <Typography variant="h6" fontWeight={800}>
                  Tatione Telecom bot
                </Typography>
                <Chip label="especialista em telecom" size="small" sx={{ ml: 1 }} />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <Link href="/#chat" style={{ textDecoration: "none" }}>
                  <Typography color="primary.main" fontWeight={700}>Abrir Chat</Typography>
                </Link>
                <StatusBadge />
              </Stack>
            </Toolbar>
          </AppBar>

          <Container maxWidth="md">
            <Box mt={4} mb={8}>
              {children}
            </Box>
          </Container>
        </ThemeProvider>
      </body>
    </html>
  );
}
