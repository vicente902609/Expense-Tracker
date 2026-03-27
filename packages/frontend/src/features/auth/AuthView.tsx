import { useState } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";
import { useMutation } from "@tanstack/react-query";

import { login, register } from "../../api/auth.js";

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
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#1a1a18",
        p: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 390 }}>
        <Typography sx={{ mb: 1.25, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>
          Auth · {mode === "register" ? "Sign Up" : "Sign In"}
        </Typography>

        <Box sx={{ borderRadius: 5, bgcolor: "#111110", border: "1px solid rgba(255,255,255,0.08)", p: 3 }}>
          <Stack spacing={3}>
            <Box
              sx={{
                width: 36,
                height: 36,
                display: "grid",
                placeItems: "center",
                borderRadius: 2.5,
                bgcolor: "rgba(79,143,247,0.28)",
                color: "#8fb9ff",
              }}
            >
              <CurrencyExchangeRoundedIcon fontSize="small" />
            </Box>

            <Box>
              <Typography variant="h4">{mode === "register" ? "Create account" : "Welcome back"}</Typography>
              <Typography color="text.secondary">
                {mode === "register" ? "Track your spending, hit your goals." : "Sign in to continue tracking your budget."}
              </Typography>
            </Box>

            {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}

            {mode === "register" ? <TextField label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /> : null}
            <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            <TextField label="Password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />

            <Button variant="outlined" size="large" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Working..." : mode === "register" ? "Create account" : "Sign in"}
            </Button>

            <Typography sx={{ textAlign: "center", color: "text.secondary" }}>
              {mode === "register" ? "Already have an account?" : "Need an account?"}{" "}
              <Button color="inherit" onClick={() => setMode(mode === "register" ? "login" : "register")} sx={{ minWidth: 0, p: 0, color: "#8fb9ff" }}>
                {mode === "register" ? "Sign in" : "Sign up"}
              </Button>
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
