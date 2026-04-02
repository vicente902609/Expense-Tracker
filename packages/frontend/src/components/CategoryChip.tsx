import { CategoryChipDot, CategoryChipRoot } from "./CategoryChip.styles";

type CategoryChipProps = {
  label: string;
  /** Hex color for the category dot. Omit for the "All" chip. */
  accentColor?: string;
  selected: boolean;
  onClick: () => void;
};

/** Filter chip with an optional category color dot — stays visible in both selected and unselected states. */
export const CategoryChip = ({ label, accentColor, selected, onClick }: CategoryChipProps) => (
  <CategoryChipRoot
    label={label}
    onClick={onClick}
    color={selected ? "primary" : "default"}
    variant={selected ? "filled" : "outlined"}
    icon={accentColor ? <CategoryChipDot $color={accentColor} /> : undefined}
  />
);
