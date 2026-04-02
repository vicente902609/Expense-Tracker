import { useState } from "react";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";
import { useMutation } from "@tanstack/react-query";

import type { AuthSessionData } from "@/types";
import { login, register } from "@/api/auth";
import { AuthCard, AuthIconBox, AuthRoot } from "./AuthPage.styles";

type AuthPageProps = {
  onAuthenticated: (session: AuthSessionData) => void;
};

export const AuthPage = ({ onAuthenticated }: AuthPageProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "register") {
        return register({ name: form.name, email: form.email, password: form.password });
      }
      return login({ email: form.email, password: form.password });
    },
    onSuccess: (data) => {
      onAuthenticated(data);
    },
  });

  return (
    <AuthRoot>
      <Container maxWidth="sm" sx={{ width: "100%" }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "text.secondary",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          {mode === "register" ? "Sign up" : "Sign in"}
        </Typography>

        <AuthCard>
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AuthIconBox>
                <CurrencyExchangeRoundedIcon />
              </AuthIconBox>
              <Box>
                <Typography variant="h4">{mode === "register" ? "Create account" : "Welcome back"}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {mode === "register" ? "Track spending and savings in one place." : "Continue where you left off."}
                </Typography>
              </Box>
            </Stack>

            {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}

            {mode === "register" ? (
              <TextField
                label="Name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            ) : null}
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
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
        </AuthCard>
      </Container>
    </AuthRoot>
  );
};
