import { Button, Stack, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import { SmartEntryPromptBox, SmartEntryRoot } from "./SmartEntryCard.styles";

type SmartEntryCardProps = {
  onOpenSmartEntry: () => void;
};

export const SmartEntryCard = ({ onOpenSmartEntry }: SmartEntryCardProps) => (
  <SmartEntryRoot>
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems={{ xs: "stretch", sm: "center" }}
    >
      <SmartEntryPromptBox>
        <Typography variant="body2" color="text.secondary">
          Describe a purchase in plain language — we'll prep the form.
        </Typography>
      </SmartEntryPromptBox>
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
  </SmartEntryRoot>
);
