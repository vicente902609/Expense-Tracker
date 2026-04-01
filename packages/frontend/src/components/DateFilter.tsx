import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  formatDateRangeLabel,
  getDefaultModalRange,
  isValidIsoRange,
  type DateFilterKind,
  type DateFilterScope,
} from "@/lib/date-filter";
import { sectionLabelSx } from "@/theme/ui";

export type DateFilterLabels = {
  today?: string;
  week?: string;
  month?: string;
  range?: string;
};

const defaultLabels: Required<DateFilterLabels> = {
  today: "Today",
  week: "This week",
  month: "This month",
  range: "Date range",
};

export type DateFilterPresetVisibility = {
  today?: boolean;
  week?: boolean;
  month?: boolean;
};

const defaultPresetVisibility: Required<DateFilterPresetVisibility> = {
  today: true,
  week: true,
  month: true,
};

type DateFilterProps = {
  kind: DateFilterKind;
  fromDate: string;
  toDate: string;
  onSelectPreset: (next: Exclude<DateFilterKind, "range">) => void;
  onApplyRange: (from: string, to: string) => void;
  labels?: DateFilterLabels;
  sectionLabel?: string;
  align?: "left" | "right";
  /** Controls default ranges for presets and the custom-range modal baseline. */
  scope?: DateFilterScope;
  /** Hide preset chips (e.g. Reports only shows “Last 6 months”, “This year”, and custom range). */
  presetVisibility?: DateFilterPresetVisibility;
};

export const DateFilter = ({
  kind,
  fromDate,
  toDate,
  onSelectPreset,
  onApplyRange,
  labels: labelsProp,
  sectionLabel = "Date range",
  align = "left",
  scope = "expenses",
  presetVisibility: presetVisibilityProp,
}: DateFilterProps) => {
  const labels = { ...defaultLabels, ...labelsProp };
  const presetVisibility = { ...defaultPresetVisibility, ...presetVisibilityProp };
  const [modalOpen, setModalOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(fromDate);
  const [draftTo, setDraftTo] = useState(toDate);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const openModal = () => {
    if (kind === "range") {
      setDraftFrom(fromDate);
      setDraftTo(toDate);
    } else {
      const d = getDefaultModalRange(scope);
      setDraftFrom(d.from);
      setDraftTo(d.to);
    }
    setRangeError(null);
    setModalOpen(true);
  };

  const handleConfirmRange = () => {
    if (!isValidIsoRange(draftFrom, draftTo)) {
      setRangeError("From must be on or before To.");
      return;
    }
    onApplyRange(draftFrom, draftTo);
    setRangeError(null);
    setModalOpen(false);
  };

  const textAlign = align === "right" ? { textAlign: { xs: "left", sm: "right" } as const } : {};
  const justify = align === "right" ? { justifyContent: { xs: "flex-start", sm: "flex-end" } as const } : {};

  return (
    <>
      <Box sx={{ width: { xs: "100%", sm: "auto" }, maxWidth: { sm: 420 }, alignSelf: { xs: "stretch", sm: "flex-start" } }}>
        <Typography sx={(theme) => ({ ...sectionLabelSx(theme), mb: 1.25, ...textAlign })}>{sectionLabel}</Typography>
        <Stack spacing={1.5} sx={{ alignItems: align === "right" ? { xs: "stretch", sm: "flex-end" } : "stretch" }}>
          <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap sx={justify}>
            {presetVisibility.today ? (
              <Chip
                label={labels.today}
                onClick={() => onSelectPreset("today")}
                color={kind === "today" ? "primary" : "default"}
                variant={kind === "today" ? "filled" : "outlined"}
                sx={{
                  minHeight: 36,
                  fontWeight: 600,
                  borderColor: (theme) => alpha(theme.palette.common.white, 0.15),
                  bgcolor: kind === "today" ? undefined : alpha("#ffffff", 0.04),
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            ) : null}
            {presetVisibility.week ? (
              <Chip
                label={labels.week}
                onClick={() => onSelectPreset("week")}
                color={kind === "week" ? "primary" : "default"}
                variant={kind === "week" ? "filled" : "outlined"}
                sx={{
                  minHeight: 36,
                  fontWeight: 600,
                  borderColor: (theme) => alpha(theme.palette.common.white, 0.15),
                  bgcolor: kind === "week" ? undefined : alpha("#ffffff", 0.04),
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            ) : null}
            {presetVisibility.month ? (
              <Chip
                label={labels.month}
                onClick={() => onSelectPreset("month")}
                color={kind === "month" ? "primary" : "default"}
                variant={kind === "month" ? "filled" : "outlined"}
                sx={{
                  minHeight: 36,
                  fontWeight: 600,
                  borderColor: (theme) => alpha(theme.palette.common.white, 0.15),
                  bgcolor: kind === "month" ? undefined : alpha("#ffffff", 0.04),
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            ) : null}
            {kind === "range" ? (
              <Button
                variant="outlined"
                color="primary"
                onClick={openModal}
                sx={{
                  minHeight: 36,
                  fontWeight: 600,
                  textTransform: "none",
                  px: 1.5,
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
                }}
              >
                {formatDateRangeLabel(fromDate, toDate)}
              </Button>
            ) : (
              <Chip
                label={labels.range}
                onClick={openModal}
                color="default"
                variant="outlined"
                sx={{
                  minHeight: 36,
                  fontWeight: 600,
                  borderColor: (theme) => alpha(theme.palette.common.white, 0.15),
                  bgcolor: alpha("#ffffff", 0.04),
                  "& .MuiChip-label": { px: 1.25 },
                }}
              />
            )}
          </Stack>
        </Stack>
      </Box>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Custom date range</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              type="date"
              label="From"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              type="date"
              label="To"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            {rangeError ? (
              <Typography variant="body2" color="error">
                {rangeError}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button color="inherit" onClick={() => setModalOpen(false)} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleConfirmRange} sx={{ minHeight: 44 }}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
