export type VariantOption = {
  id: string;
  label: string;
  priceDelta?: number;
  isDefault?: boolean;
};
export type VariantGroup = {
  id: string;
  label: string;
  required?: boolean;
  selectionType: "single" | "multiple";
  minSelect?: number; // a "pick 8" set: minSelect = maxSelect = 8
  maxSelect?: number | null; // null or > 1: the same option can be picked more than once
  options: VariantOption[];
};
