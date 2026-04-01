import { alpha } from "@mui/material/styles";
import { Box, Button, Stack, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import { radiusInner, surfaceCard } from "@/theme/ui";

type SmartEntryCardProps = {
  onOpenSmartEntry: () => void;
};

export const SmartEntryCard = ({ onOpenSmartEntry }: SmartEntryCardProps) => (
  <Box sx={(theme) => ({ p: { xs: 1.75, sm: 2 }, ...surfaceCard(theme) })}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
      <Box
        sx={(theme) => ({
          flex: 1,
          px: 2,
          py: 1.5,
          borderRadius: radiusInner(theme),
          bgcolor: alpha(theme.palette.common.white, 0.04),
          border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
        })}
      >
        <Typography variant="body2" color="text.secondary">
          Describe a purchase in plain language — we’ll prep the form.
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AutoAwesomeRoundedIcon />}
        onClick={onOpenSmartEntry}
        sx={{ minHeight: 48, px: 2.5, flexShrink: 0 }}
      >
        Add Expense
      </Button>
    </Stack>
  </Box>
);
