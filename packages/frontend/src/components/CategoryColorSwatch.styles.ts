import { styled } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box } from "@mui/material";

export const SwatchBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$size" && prop !== "$color",
})<{ $size: number; $color: string }>(({ $size, $color }) => ({
  width: $size,
  height: $size,
  flexShrink: 0,
  borderRadius: "10px",
  backgroundColor: $color,
  border: `1px solid ${alpha("#000000", 0.35)}`,
  boxShadow: `0 1px 2px ${alpha("#000000", 0.45)}`,
}));
