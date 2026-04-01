import { useState } from "react";
import type { CustomCategoryApi, Expense, PredefinedCategory } from "@expense-tracker/shared";
import { useQuery } from "@tanstack/react-query";
import { alpha } from "@mui/material/styles";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { fetchAllExpenses } from "@/api/expenses";
import { CategoryColorSwatch } from "@/components/CategoryColorSwatch";
import { useCategories } from "@/hooks/use-categories";
import { listRowInteractive, RADIUS_INNER, radiusInner, sectionLabelSx, surfaceCard } from "@/theme/ui";

const getCategoryCount = (expenses: Expense[], categoryId: string) => expenses.filter((expense) => expense.categoryId === categoryId).length;

const defaultGray = "#8e8e87";

export const CategoriesView = () => {
  const expensesQuery = useQuery({
    queryKey: ["expenses", "all"],
    queryFn: fetchAllExpenses,
  });
  const expenses = expensesQuery.data ?? [];

  const [draftCategory, setDraftCategory] = useState("");
  const [addColorHex, setAddColorHex] = useState(defaultGray);
  const [editingEntry, setEditingEntry] = useState<CustomCategoryApi | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editColorHex, setEditColorHex] = useState(defaultGray);
  const {
    addCategory,
    addError,
    addPending,
    custom,
    deleteCategory,
    deletePending,
    predefined,
    updateCategory,
    updatePending,
  } = useCategories();

  const openEdit = (entry: CustomCategoryApi) => {
    setEditingEntry(entry);
    setEditingName(entry.name);
    setEditColorHex(entry.color);
  };

  const renderPredefinedRow = (row: PredefinedCategory) => {
    const count = getCategoryCount(expenses, row.categoryId);

    return (
      <Stack
        key={row.categoryId}
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={{ xs: 1.25, sm: 0 }}
        sx={(theme) => ({
          py: 1.75,
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          ...listRowInteractive(theme),
        })}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <CategoryColorSwatch color={row.color} />
          <Typography sx={{ fontWeight: 600 }} noWrap>
            {row.name}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
          <Typography variant="body2" color="text.secondary">
            {count} expenses
          </Typography>
          <Chip
            label="Default"
            size="small"
            sx={(theme) => ({
              height: 26,
              fontWeight: 600,
              fontSize: 11,
              bgcolor: alpha(theme.palette.common.white, 0.08),
              border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
            })}
          />
        </Stack>
      </Stack>
    );
  };

  const renderCustomRow = (entry: CustomCategoryApi) => {
    const count = getCategoryCount(expenses, entry.categoryId);

    return (
      <Stack
        key={entry.categoryId}
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={{ xs: 1.25, sm: 0 }}
        sx={(theme) => ({
          py: 1.75,
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          ...listRowInteractive(theme),
        })}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <CategoryColorSwatch color={entry.color} />
          <Typography sx={{ fontWeight: 600 }} noWrap>
            {entry.name}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
          <Typography variant="body2" color="text.secondary">
            {count} expenses
          </Typography>
          <Chip
            label="Custom"
            size="small"
            sx={(theme) => ({
              height: 26,
              fontWeight: 600,
              fontSize: 11,
              bgcolor: alpha(theme.palette.common.white, 0.08),
              border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
            })}
          />
          <Button color="inherit" size="small" onClick={() => openEdit(entry)} sx={{ minHeight: 40 }}>
            Edit
          </Button>
          <Button color="inherit" size="small" disabled={deletePending} onClick={() => void deleteCategory(entry.categoryId)} sx={{ minHeight: 40 }}>
            Delete
          </Button>
        </Stack>
      </Stack>
    );
  };

  const nameColorAdornment = (hex: string, onChange: (value: string) => void) => (
    <InputAdornment position="start" sx={{ mr: 0.5 }}>
      <Box
        component="input"
        type="color"
        value={hex}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Category color"
        sx={(theme) => ({
          width: 28,
          height: 28,
          padding: 0,
          border: "none",
          borderRadius: radiusInner(theme),
          cursor: "pointer",
          flexShrink: 0,
          backgroundColor: hex,
          "&::-webkit-color-swatch-wrapper": { padding: 0 },
          "&::-webkit-color-swatch": { border: "none", borderRadius: RADIUS_INNER },
        })}
      />
    </InputAdornment>
  );

  if (expensesQuery.isLoading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, maxWidth: 920, mx: "auto" }}>
      <Box>
        <Typography sx={(theme) => sectionLabelSx(theme)}>Categories</Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          Labels & rules
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Default categories are loaded from the server; add your own labels and colors below.
        </Typography>
      </Box>

      <Box sx={(theme) => ({ overflow: "hidden", ...surfaceCard(theme) })}>
        <Box sx={(theme) => ({ px: { xs: 1.75, sm: 2 }, py: 2, borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}` })}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {predefined.length + custom.length} total
          </Typography>
        </Box>

        <Box sx={{ px: { xs: 1.75, sm: 2 }, pb: 2, pt: 0.5 }}>
          <Typography sx={(theme) => ({ ...sectionLabelSx(theme), mt: 2, mb: 1 })}>Predefined</Typography>
          {predefined.map((row) => renderPredefinedRow(row))}

          <Typography sx={(theme) => ({ ...sectionLabelSx(theme), mt: 3, mb: 1 })}>Custom</Typography>
          {custom.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No custom categories yet.
            </Typography>
          ) : null}
          {custom.map((entry) => renderCustomRow(entry))}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ pt: 2.5 }} alignItems={{ xs: "stretch", sm: "flex-start" }}>
            <TextField
              size="small"
              placeholder="New Category Name"
              value={draftCategory}
              onChange={(event) => setDraftCategory(event.target.value)}
              InputProps={{
                startAdornment: nameColorAdornment(addColorHex, setAddColorHex),
              }}
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiOutlinedInput-root": {
                  pl: 1,
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              disabled={addPending || !draftCategory.trim()}
              onClick={async () => {
                try {
                  await addCategory(draftCategory, addColorHex);
                  setDraftCategory("");
                  setAddColorHex(defaultGray);
                } catch {
                  /* addError */
                }
              }}
              sx={{ minHeight: 40, flexShrink: 0, alignSelf: { sm: "center" } }}
            >
              Add
            </Button>
          </Stack>
          {addError ? (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {addError.message}
            </Alert>
          ) : null}
        </Box>
      </Box>

      <Dialog open={Boolean(editingEntry)} onClose={() => setEditingEntry(null)} fullWidth maxWidth="xs">
        <DialogTitle>Edit category</DialogTitle>
        <DialogContent>
          <TextField
            label="Category name"
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
            fullWidth
            autoFocus
            margin="dense"
            sx={{ mt: 0.5 }}
            InputProps={{
              startAdornment: nameColorAdornment(editColorHex, setEditColorHex),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button color="inherit" onClick={() => setEditingEntry(null)} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (!editingEntry) {
                return;
              }

              const to = editingName.trim();
              if (!to) {
                return;
              }

              try {
                await updateCategory(editingEntry.categoryId, {
                  name: to,
                  color: editColorHex,
                });
                setEditingEntry(null);
              } catch {
                /* API error */
              }
            }}
            disabled={updatePending || !editingName.trim()}
            sx={{ minHeight: 44 }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
