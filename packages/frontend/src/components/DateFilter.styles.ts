import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box, Button, Chip } from "@mui/material";

export const FilterRoot = styled(Box)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: "auto",
    maxWidth: 420,
  },
  alignSelf: "flex-start",
  [theme.breakpoints.down("sm")]: {
    alignSelf: "stretch",
  },
}));

export const FilterPresetChip = styled(Chip)(({ theme }) => ({
  minHeight: 36,
  fontWeight: 600,
  "& .MuiChip-label": {
    paddingLeft: theme.spacing(1.25),
    paddingRight: theme.spacing(1.25),
  },
  "&.MuiChip-colorDefault": {
    borderColor: alpha(theme.palette.common.white, 0.15),
    backgroundColor: alpha("#ffffff", 0.04),
  },
}));

export const ActiveRangeButton = styled(Button)(({ theme }) => ({
  minHeight: 36,
  fontWeight: 600,
  textTransform: "none",
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  borderColor: alpha(theme.palette.primary.main, 0.5),
}));
