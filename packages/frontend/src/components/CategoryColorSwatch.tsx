import { SwatchBox } from "./CategoryColorSwatch.styles";

type CategoryColorSwatchProps = {
  color: string;
  /** Pixel width/height (default 40). */
  size?: number;
};

/** Rounded square swatch — solid fill with a crisp edge (category list rows). */
export const CategoryColorSwatch = ({ color, size = 40 }: CategoryColorSwatchProps) => (
  <SwatchBox $size={size} $color={color} />
);
