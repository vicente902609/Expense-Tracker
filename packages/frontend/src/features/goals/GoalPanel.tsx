import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createGoal, listGoals } from "../../api/goals.js";

export const GoalPanel = () => {
  const queryClient = useQueryClient();
  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: listGoals,
  });
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      createGoal({
        name: form.name,
        targetAmount: Number(form.targetAmount),
        targetDate: form.targetDate,
      }),
    onSuccess: () => {
      setForm({
        name: "",
        targetAmount: "",
        targetDate: "",
      });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return (
    <Stack spacing={2}>
      <Card sx={{ background: "linear-gradient(135deg, rgba(15,118,110,0.08), rgba(194,65,12,0.08))" }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Goals & ETA Forecast</Typography>
            <Typography color="text.secondary">
              This card stays visible on the dashboard and refreshes as your spending changes.
            </Typography>

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
              <Box>
                <TextField
                  label="Goal name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  fullWidth
                />
              </Box>
              <Box>
                <TextField
                  label="Target amount"
                  value={form.targetAmount}
                  onChange={(event) => setForm((current) => ({ ...current, targetAmount: event.target.value }))}
                  fullWidth
                />
              </Box>
              <Box>
                <TextField
                  label="Target date"
                  type="date"
                  value={form.targetDate}
                  onChange={(event) => setForm((current) => ({ ...current, targetDate: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
            </Box>

            {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}

            <Button
              variant="contained"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.name || !form.targetAmount || !form.targetDate}
            >
              {mutation.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
        {(goalsQuery.data ?? []).map((goal) => (
          <Box key={goal.id}>
            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{goal.name}</Typography>
                    <Chip label={goal.status.replace("_", " ")} color={goal.status === "on_track" ? "success" : goal.status === "achieved" ? "primary" : "warning"} />
                  </Stack>
                  <Typography color="text.secondary">
                    ${goal.currentAmount.toFixed(0)} saved of ${goal.targetAmount.toFixed(0)} target by {goal.targetDate}
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: "rgba(15,118,110,0.08)", borderRadius: 3 }}>
                    <Typography>{goal.aiEtaInsight}</Typography>
                  </Box>
                  <Typography color="text.secondary">
                    Projected ETA: {goal.forecast.projectedEta ?? "Not enough data yet"} · Monthly savings pace: ${goal.forecast.monthlySavingsRate.toFixed(0)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
      {!goalsQuery.isLoading && (goalsQuery.data?.length ?? 0) === 0 ? <Typography color="text.secondary">No goals yet. Create one to start tracking your ETA.</Typography> : null}
    </Stack>
  );
};
