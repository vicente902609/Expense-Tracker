import { alpha, styled } from "@mui/material/styles";
import { Box, Chip } from "@mui/material";

export const CategoryChipRoot = styled(Chip)(({ theme }) => ({
  flexShrink: 0,
  minHeight: 40,
  fontWeight: 600,
  "&.MuiChip-colorDefault": {
    borderColor: alpha(theme.palette.common.white, 0.15),
    backgroundColor: alpha("#ffffff", 0.04),
  },
  "& .MuiChip-icon": {
    marginLeft: 10,
    marginRight: -4,
  },
}));

export const CategoryChipDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$color",
})<{ $color: string }>(({ $color }) => ({
  width: 8,
  height: 8,
  flexShrink: 0,
  borderRadius: "50%",
  backgroundColor: $color,
  border: "1.5px solid rgba(255,255,255,0.2)",
}));
