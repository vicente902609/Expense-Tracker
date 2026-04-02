import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  formatDateRangeLabel,
  getDefaultModalRange,
  isValidIsoRange,
  type DateFilterKind,
  type DateFilterScope,
} from "@/lib/date-filter";
import { sectionLabelSx } from "@/theme/ui";
import { ActiveRangeButton, FilterPresetChip, FilterRoot } from "./DateFilter.styles";

export type DateFilterLabels = {
  day?: string;
  week?: string;
  month?: string;
  range?: string;
};

const defaultLabels: Required<DateFilterLabels> = {
  day: "Today",
  week: "This week",
  month: "This month",
  range: "Date range",
};

export type DateFilterPresetVisibility = {
  day?: boolean;
  week?: boolean;
  month?: boolean;
};

/** Maps a preset key to a tooltip message shown when the preset is disabled. */
export type DateFilterDisabledPresets = Partial<Record<Exclude<DateFilterKind, "range">, string>>;

const defaultPresetVisibility: Required<DateFilterPresetVisibility> = {
  day: true,
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
  scope?: DateFilterScope;
  presetVisibility?: DateFilterPresetVisibility;
  disabledPresets?: DateFilterDisabledPresets;
};

const renderPreset = (
  presetKey: Exclude<DateFilterKind, "range">,
  label: string,
  isActive: boolean,
  onSelectPreset: (next: Exclude<DateFilterKind, "range">) => void,
  disabledTooltip?: string,
) => {
  const chip = (
    <FilterPresetChip
      label={label}
      onClick={disabledTooltip ? undefined : () => onSelectPreset(presetKey)}
      color={isActive ? "primary" : "default"}
      variant={isActive ? "filled" : "outlined"}
      disabled={Boolean(disabledTooltip)}
    />
  );

  if (disabledTooltip) {
    return (
      <Tooltip key={presetKey} title={disabledTooltip} arrow placement="top">
        {/* span wrapper required — disabled elements don't fire mouse events for Tooltip */}
        <span>{chip}</span>
      </Tooltip>
    );
  }

  return <span key={presetKey}>{chip}</span>;
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
  disabledPresets,
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
      <FilterRoot>
        <Typography sx={(theme) => ({ ...sectionLabelSx(theme), mb: 1.25, ...textAlign })}>{sectionLabel}</Typography>
        <Stack spacing={1.5} sx={{ alignItems: align === "right" ? { xs: "stretch", sm: "flex-end" } : "stretch" }}>
          <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap sx={justify}>
            {presetVisibility.day
              ? renderPreset("day", labels.day, kind === "day", onSelectPreset, disabledPresets?.day)
              : null}
            {presetVisibility.week
              ? renderPreset("week", labels.week, kind === "week", onSelectPreset, disabledPresets?.week)
              : null}
            {presetVisibility.month
              ? renderPreset("month", labels.month, kind === "month", onSelectPreset, disabledPresets?.month)
              : null}
            {kind === "range" ? (
              <ActiveRangeButton variant="outlined" color="primary" onClick={openModal}>
                {formatDateRangeLabel(fromDate, toDate)}
              </ActiveRangeButton>
            ) : (
              <FilterPresetChip label={labels.range} onClick={openModal} color="default" variant="outlined" />
            )}
          </Stack>
        </Stack>
      </FilterRoot>

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
