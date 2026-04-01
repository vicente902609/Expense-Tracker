import { useState } from "react";
import type { Expense } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { useCustomCategories } from "@/hooks/use-custom-categories";
import { getCategoryIcon } from "@/lib/category-icons";
import { getCategoryColor, predefinedCategories } from "@/lib/expense-ui";
import { listRowInteractive, radiusInner, sectionLabelSx, surfaceCard } from "@/theme/ui";

type CategoriesViewProps = {
  expenses: Expense[];
};

const getCategoryCount = (expenses: Expense[], category: string) => expenses.filter((expense) => expense.category === category).length;

export const CategoriesView = ({ expenses }: CategoriesViewProps) => {
  const [draftCategory, setDraftCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const { addCategory, addError, addPending, categories: customCategories, deleteCategory, deletePending, renameCategory, renamePending } =
    useCustomCategories();

  const renderRow = (category: string, isDefault: boolean) => {
    const Icon = getCategoryIcon(category);
    const count = getCategoryCount(expenses, category);

    return (
      <Stack
        key={category}
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
          <Box
            sx={(theme) => ({
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              borderRadius: radiusInner(theme),
              flexShrink: 0,
              bgcolor: alpha(theme.palette.common.white, 0.06),
              color: getCategoryColor(category),
              border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
            })}
          >
            <Icon fontSize="small" />
          </Box>
          <Typography sx={{ fontWeight: 600 }} noWrap>
            {category}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
          <Typography variant="body2" color="text.secondary">
            {count} expenses
          </Typography>
          <Chip
            label={isDefault ? "Default" : "Custom"}
            size="small"
            sx={(theme) => ({
              height: 26,
              fontWeight: 600,
              fontSize: 11,
              bgcolor: alpha(theme.palette.common.white, 0.08),
              border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
            })}
          />
          {!isDefault ? (
            <>
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setEditingCategory(category);
                  setEditingName(category);
                }}
                sx={{ minHeight: 40 }}
              >
                Edit
              </Button>
              <Button color="inherit" size="small" disabled={deletePending} onClick={() => void deleteCategory(category)} sx={{ minHeight: 40 }}>
                Delete
              </Button>
            </>
          ) : null}
        </Stack>
      </Stack>
    );
  };

  return (
    <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, maxWidth: 920, mx: "auto" }}>
      <Box>
        <Typography sx={(theme) => sectionLabelSx(theme)}>Categories</Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          Labels & rules
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Built-in categories plus your custom names (synced to your account).
        </Typography>
      </Box>

      <Box sx={(theme) => ({ overflow: "hidden", ...surfaceCard(theme) })}>
        <Box sx={(theme) => ({ px: { xs: 1.75, sm: 2 }, py: 2, borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.08)}` })}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {predefinedCategories.length + customCategories.length} total
          </Typography>
        </Box>

        <Box sx={{ px: { xs: 1.75, sm: 2 }, pb: 2, pt: 0.5 }}>
          <Typography sx={(theme) => ({ ...sectionLabelSx(theme), mt: 2, mb: 1 })}>Predefined</Typography>
          {predefinedCategories.map((category) => renderRow(category, true))}

          <Typography sx={(theme) => ({ ...sectionLabelSx(theme), mt: 3, mb: 1 })}>Custom</Typography>
          {customCategories.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No custom categories yet.
            </Typography>
          ) : null}
          {customCategories.map((category) => renderRow(category, false))}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ pt: 2.5 }}>
            <TextField
              size="small"
              placeholder="New category name"
              value={draftCategory}
              onChange={(event) => setDraftCategory(event.target.value)}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              disabled={addPending || !draftCategory.trim()}
              onClick={async () => {
                try {
                  await addCategory(draftCategory);
                  setDraftCategory("");
                } catch {
                  /* addError */
                }
              }}
              sx={{ minHeight: 44, flexShrink: 0 }}
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

      <Dialog open={Boolean(editingCategory)} onClose={() => setEditingCategory(null)} fullWidth maxWidth="xs">
        <DialogTitle>Edit category</DialogTitle>
        <DialogContent>
          <TextField label="Category name" value={editingName} onChange={(event) => setEditingName(event.target.value)} sx={{ mt: 1 }} fullWidth autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button color="inherit" onClick={() => setEditingCategory(null)} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              if (!editingCategory) {
                return;
              }

              try {
                await renameCategory(editingCategory, editingName);
                setEditingCategory(null);
              } catch {
                /* API error */
              }
            }}
            disabled={renamePending || !editingName.trim()}
            sx={{ minHeight: 44 }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
