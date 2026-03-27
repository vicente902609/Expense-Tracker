import type { Expense } from "@expense-tracker/shared";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import { getCategoryIcon } from "../../lib/category-icons.js";
import { getCategoryColor } from "../../lib/expense-ui.js";
import { useExpenseEditor } from "./hooks/use-expense-editor.js";

type ExpenseEditorDialogProps = {
  availableCategories: string[];
  expense?: Expense | null;
  open: boolean;
  onClose: () => void;
};

export const ExpenseEditorDialog = ({ availableCategories, expense, open, onClose }: ExpenseEditorDialogProps) => {
  const fullScreen = useMediaQuery((t) => t.breakpoints.down("sm"));
  const { deleteMutation, form, parseMutation, saveMutation, setForm, setSmartText, smartText } = useExpenseEditor(expense, onClose);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={fullScreen} scroll="paper">
      <DialogContent sx={{ px: 0, py: 0, pt: fullScreen ? 2 : 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, borderBottom: (t) => `1px solid ${alpha(t.palette.common.white, 0.08)}` }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6">{expense ? "Edit expense" : "Smart entry"}</Typography>
              {!expense ? (
                <Box
                  sx={(t) => ({
                    px: 1,
                    py: 0.35,
                    borderRadius: "10px",
                    bgcolor: alpha(t.palette.primary.main, 0.2),
                    color: "primary.light",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                  })}
                >
                  AI
                </Box>
              ) : null}
            </Stack>
            <IconButton onClick={onClose} color="inherit" sx={{ minWidth: 44, minHeight: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={2.25} sx={{ p: { xs: 2, sm: 3 } }}>
            {!expense ? (
              <>
                <Box>
                  <Typography sx={{ mb: 1, fontSize: 13, color: "text.secondary", fontWeight: 600 }}>Describe your expense</Typography>
                  <TextField
                    placeholder='e.g. lunch with a client $24 downtown yesterday'
                    value={smartText}
                    onChange={(event) => setSmartText(event.target.value)}
                    multiline
                    minRows={fullScreen ? 3 : 2}
                    fullWidth
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Try: &quot;coffee $4.50 this morning&quot; or &quot;Uber $18 last Friday&quot;
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AutoAwesomeRoundedIcon />}
                  onClick={() => parseMutation.mutate()}
                  disabled={parseMutation.isPending || smartText.trim().length < 3}
                  sx={{ minHeight: 48 }}
                >
                  Parse with AI
                </Button>

                {parseMutation.isPending ? (
                  <Stack spacing={1}>
                    <Skeleton variant="rounded" height={52} />
                    <Skeleton variant="rounded" height={52} />
                    <Skeleton variant="rounded" height={52} />
                  </Stack>
                ) : null}
              </>
            ) : null}

            {parseMutation.error ? <Alert severity="warning">{parseMutation.error.message}</Alert> : null}
            {saveMutation.error ? <Alert severity="error">{saveMutation.error.message}</Alert> : null}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Amount"
                placeholder="$0.00"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                error={Boolean(smartText) && !form.amount}
                helperText={Boolean(smartText) && !form.amount ? "AI left this blank — add an amount." : undefined}
                fullWidth
              />
              <TextField
                label="Date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                error={Boolean(smartText) && !form.date}
                helperText={Boolean(smartText) && !form.date ? "Pick a date." : undefined}
                fullWidth
              />
            </Stack>

            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              error={Boolean(smartText) && !form.description}
              helperText={Boolean(smartText) && !form.description ? "Add a short description." : undefined}
              fullWidth
            />

            <TextField
              label="Category"
              select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              error={Boolean(smartText) && !form.category}
              helperText={Boolean(smartText) && !form.category ? "Choose a category." : undefined}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  const value = selected as string;
                  if (!value) {
                    return (
                      <Typography variant="body2" color="text.secondary" component="span" sx={{ lineHeight: 1.5 }}>
                        Select…
                      </Typography>
                    );
                  }
                  const Icon = getCategoryIcon(value);
                  return (
                    <Stack direction="row" spacing={1.25} alignItems="center" component="span" sx={{ py: 0.25, minHeight: 24 }}>
                      <Icon sx={{ fontSize: 20, color: getCategoryColor(value), flexShrink: 0 }} />
                      <Typography component="span" variant="body2" sx={{ lineHeight: 1.5 }}>
                        {value}
                      </Typography>
                    </Stack>
                  );
                },
              }}
            >
              {availableCategories.map((category) => {
                const Icon = getCategoryIcon(category);
                return (
                  <MenuItem key={category} value={category}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Icon sx={{ fontSize: 20, color: getCategoryColor(category), flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                        {category}
                      </Typography>
                    </Stack>
                  </MenuItem>
                );
              })}
            </TextField>

            <Button
              variant="contained"
              color="primary"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.amount || !form.description || !form.category || !form.date}
              sx={{ minHeight: 48 }}
            >
              {saveMutation.isPending ? "Saving..." : expense ? "Save changes" : "Add expense"}
            </Button>

            {expense ? (
              <Button color="inherit" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} sx={{ minHeight: 44 }}>
                {deleteMutation.isPending ? "Deleting..." : "Delete expense"}
              </Button>
            ) : null}
          </Stack>
      </DialogContent>
    </Dialog>
  );
};
