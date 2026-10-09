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
  maxSelect?: number | null;
  options: VariantOption[];
};
