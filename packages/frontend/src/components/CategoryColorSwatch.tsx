import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

type CategoryColorSwatchProps = {
  color: string;
  /** Pixel width/height (default 40). */
  size?: number;
};

/** Rounded square swatch — solid fill with a crisp edge (category list rows). */
export const CategoryColorSwatch = ({ color, size = 40 }: CategoryColorSwatchProps) => (
  <Box
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: "10px",
      bgcolor: color,
      border: `1px solid ${alpha("#000000", 0.35)}`,
      boxShadow: `0 1px 2px ${alpha("#000000", 0.45)}`,
    }}
  />
);
