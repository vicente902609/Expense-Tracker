import { useState } from "react";
import type { Expense } from "@expense-tracker/shared";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import FastfoodRoundedIcon from "@mui/icons-material/FastfoodRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

import { getCategoryColor, predefinedCategories } from "../../lib/expense-ui.js";
import { useCategoryManager } from "./hooks/use-category-manager.js";

type CategoriesViewProps = {
  customCategories: string[];
  expenses: Expense[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onRenameCategory: (currentName: string, nextName: string) => void;
};

const categoryIconMap: Record<string, typeof FastfoodRoundedIcon> = {
  Food: FastfoodRoundedIcon,
  Transport: DirectionsBusRoundedIcon,
  Entertainment: MovieRoundedIcon,
  Utilities: BoltRoundedIcon,
};

const getCategoryCount = (expenses: Expense[], category: string) => expenses.filter((expense) => expense.category === category).length;

export const CategoriesView = ({ customCategories, expenses, onAddCategory, onDeleteCategory, onRenameCategory }: CategoriesViewProps) => {
  const [draftCategory, setDraftCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const categoryManager = useCategoryManager({
    customCategories,
    deleteCategory: onDeleteCategory,
    expenses,
    renameCategory: onRenameCategory,
  });

  const renderRow = (category: string, isDefault: boolean) => {
    const Icon = categoryIconMap[category] ?? CategoryRoundedIcon;
    const count = getCategoryCount(expenses, category);

    return (
      <Stack key={category} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.08)",
              color: getCategoryColor(category),
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Typography sx={{ fontWeight: 700 }}>{category}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{count} expenses</Typography>
          <Box sx={{ px: 1, py: 0.3, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)", color: "text.secondary", fontSize: 11, fontWeight: 700 }}>
            {isDefault ? "default" : "custom"}
          </Box>
          {!isDefault ? (
            <>
              <Button
                color="inherit"
                onClick={() => {
                  setEditingCategory(category);
                  setEditingName(category);
                }}
              >
                Edit
              </Button>
              <Button color="inherit" onClick={() => categoryManager.deleteCategory(category)}>
                Delete
              </Button>
            </>
          ) : null}
        </Stack>
      </Stack>
    );
  };

  return (
    <Stack spacing={2} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2.25, md: 3 }, maxWidth: 920 }}>
      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>Category management</Typography>
      </Box>

      <Box sx={{ borderRadius: 3, bgcolor: "rgba(55,55,52,0.92)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h5">Categories</Typography>
          <Typography color="text.secondary">{predefinedCategories.length + customCategories.length} categories · tap to edit</Typography>
        </Box>

        <Box sx={{ p: 2, bgcolor: "rgba(20,20,19,0.72)" }}>
          <Typography sx={{ mb: 1.25, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>Predefined</Typography>
          {predefinedCategories.map((category) => renderRow(category, true))}

          <Typography sx={{ mt: 2.5, mb: 1.25, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>Custom</Typography>
          {customCategories.length === 0 ? <Typography sx={{ py: 1, color: "text.secondary" }}>No custom categories yet.</Typography> : null}
          {customCategories.map((category) => renderRow(category, false))}

          <Stack direction="row" spacing={1.25} sx={{ pt: 1.5 }}>
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.04)" }}>
              <input
                value={draftCategory}
                onChange={(event) => setDraftCategory(event.target.value)}
                placeholder="Add custom category"
                style={{ flex: 1, background: "transparent", border: "none", color: "white", outline: "none", fontSize: 14, padding: "14px 0" }}
              />
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                onAddCategory(draftCategory);
                setDraftCategory("");
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Box>

      <Dialog open={Boolean(editingCategory)} onClose={() => setEditingCategory(null)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField label="Category name" value={editingName} onChange={(event) => setEditingName(event.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setEditingCategory(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!editingCategory) {
                return;
              }

              await categoryManager.renameCategory({
                currentName: editingCategory,
                nextName: editingName,
              });
              setEditingCategory(null);
            }}
            disabled={categoryManager.renamePending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
