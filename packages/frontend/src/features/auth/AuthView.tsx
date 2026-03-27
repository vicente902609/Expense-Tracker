import { useState } from "react";
import { alpha } from "@mui/material/styles";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";
import { useMutation } from "@tanstack/react-query";

import { login, register } from "../../api/auth.js";
import { appShellGradient, RADIUS_INNER, RADIUS_SHELL } from "../../theme/ui.js";

type AuthViewProps = {
  onAuthenticated: (token: string, user: { id: string; email: string; name: string; createdAt: string }) => void;
};

export const AuthView = ({ onAuthenticated }: AuthViewProps) => {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        email: form.email,
        password: form.password,
        ...(mode === "register" ? { name: form.name } : {}),
      };

      return mode === "register" ? register(payload) : login(payload);
    },
    onSuccess: (data) => {
      onAuthenticated(data.token, data.user);
    },
  });

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: { xs: 4, sm: 6 },
        ...appShellGradient(theme),
      })}
    >
      <Container maxWidth="sm" sx={{ width: "100%" }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "text.secondary", textTransform: "uppercase", mb: 1.5 }}>
          {mode === "register" ? "Sign up" : "Sign in"}
        </Typography>

        <Box
          sx={(theme) => ({
            borderRadius: RADIUS_SHELL,
            p: { xs: 2.5, sm: 3.5 },
            bgcolor: alpha(theme.palette.background.paper, 0.85),
            backdropFilter: "blur(16px)",
            border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
            boxShadow: `0 32px 80px ${alpha("#000000", 0.5)}`,
          })}
        >
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={(theme) => ({
                  width: 48,
                  height: 48,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: RADIUS_INNER,
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  color: "primary.light",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                })}
              >
                <CurrencyExchangeRoundedIcon />
              </Box>
              <Box>
                <Typography variant="h4">{mode === "register" ? "Create account" : "Welcome back"}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {mode === "register" ? "Track spending and savings in one place." : "Continue where you left off."}
                </Typography>
              </Box>
            </Stack>

            {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}

            {mode === "register" ? (
              <TextField label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            ) : null}
            <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            <TextField label="Password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />

            <Button variant="contained" color="primary" size="large" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Working..." : mode === "register" ? "Create account" : "Sign in"}
            </Button>

            <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
              {mode === "register" ? "Already have an account?" : "Need an account?"}{" "}
              <Button
                color="primary"
                onClick={() => setMode(mode === "register" ? "login" : "register")}
                sx={{ minWidth: 0, p: 0, verticalAlign: "baseline", fontWeight: 600 }}
              >
                {mode === "register" ? "Sign in" : "Sign up"}
              </Button>
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};
