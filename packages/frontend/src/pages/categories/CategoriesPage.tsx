import { type ChangeEvent, useState } from "react";
import type { CustomCategoryApi, PredefinedCategory } from "@/types";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { CategoryColorSwatch } from "@/components/CategoryColorSwatch";
import { useCategories } from "@/hooks/use-categories";
import { sectionLabelSx } from "@/theme/ui";
import {
  CardHeaderRow,
  CategoriesCard,
  CategoryBadge,
  CategoryRow,
  ColorPickerInput,
} from "./CategoriesPage.styles";

const defaultGray = "#8e8e87";

export const CategoriesPage = () => {
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

  const nameColorAdornment = (hex: string, onChange: (value: string) => void) => (
    <InputAdornment position="start" sx={{ mr: 0.5 }}>
      <ColorPickerInput
        type="color"
        value={hex}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        aria-label="Category color"
        $hex={hex}
      />
    </InputAdornment>
  );

  const renderPredefinedRow = (row: PredefinedCategory) => (
    <CategoryRow key={row.categoryId}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        <CategoryColorSwatch color={row.color} />
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {row.name}
        </Typography>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        justifyContent={{ xs: "flex-start", sm: "flex-end" }}
      >
        <CategoryBadge label="Default" size="small" />
      </Stack>
    </CategoryRow>
  );

  const renderCustomRow = (entry: CustomCategoryApi) => (
    <CategoryRow key={entry.categoryId}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        <CategoryColorSwatch color={entry.color} />
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {entry.name}
        </Typography>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        justifyContent={{ xs: "flex-start", sm: "flex-end" }}
      >
        <CategoryBadge label="Custom" size="small" />
        <Button color="inherit" size="small" onClick={() => openEdit(entry)} sx={{ minHeight: 40 }}>
          Edit
        </Button>
        <Button
          color="inherit"
          size="small"
          disabled={deletePending}
          onClick={() => void deleteCategory(entry.categoryId)}
          sx={{ minHeight: 40 }}
        >
          Delete
        </Button>
      </Stack>
    </CategoryRow>
  );

  return (
    <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, maxWidth: 920, mx: "auto" }}>
      <Box>
        <Typography sx={(theme) => sectionLabelSx(theme)}>Categories</Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          Labels &amp; rules
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Use the built-in categories or create your own—each gets a color for charts and lists.
        </Typography>
      </Box>

      <CategoriesCard>
        <CardHeaderRow>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {predefined.length + custom.length} total
          </Typography>
        </CardHeaderRow>

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

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            sx={{ pt: 2.5 }}
            alignItems={{ xs: "stretch", sm: "flex-start" }}
          >
            <TextField
              size="small"
              placeholder="New Category Name"
              value={draftCategory}
              onChange={(event) => setDraftCategory(event.target.value)}
              InputProps={{ startAdornment: nameColorAdornment(addColorHex, setAddColorHex) }}
              sx={{ flex: 1, minWidth: 0, "& .MuiOutlinedInput-root": { pl: 1 } }}
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
      </CategoriesCard>

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
            InputProps={{ startAdornment: nameColorAdornment(editColorHex, setEditColorHex) }}
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
                await updateCategory(editingEntry.categoryId, { name: to, color: editColorHex });
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
