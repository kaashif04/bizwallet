import type { MenuItem } from "./order-types";

export type VariantOption = {
  id: string;
  label: string;
  priceDelta?: number;
  externalPosId?: string | null;
};
export type VariantGroup = {
  id: string;
  label: string;
  required?: boolean;
  selectionType: "single" | "multiple";
  externalPosId?: string | null;
  options: VariantOption[];
};

// Demo-only fallback so demo outlets (id starting with "demo-") stay fully
// explorable without Supabase. Real outlets get their modifier_groups /
// modifier_options from the POS via lib/modifiers.ts — this hardcoded set is
// never used for them.
const DRINK_VARIANTS: VariantGroup[] = [
  {
    id: "size",
    label: "Size",
    required: true,
    selectionType: "single",
    options: [
      { id: "size-regular", label: "Regular" },
      { id: "size-large", label: "Large", priceDelta: 2 },
    ],
  },
  {
    id: "ice",
    label: "Ice level",
    required: true,
    selectionType: "single",
    options: [
      { id: "ice-normal", label: "Normal" },
      { id: "ice-less", label: "Less ice" },
      { id: "ice-no", label: "No ice" },
    ],
  },
  {
    id: "sugar",
    label: "Sugar level",
    required: true,
    selectionType: "single",
    options: [
      { id: "sugar-100", label: "100%" },
      { id: "sugar-50", label: "50%" },
      { id: "sugar-25", label: "25%" },
      { id: "sugar-0", label: "0%" },
    ],
  },
];

const MAIN_VARIANTS: VariantGroup[] = [
  {
    id: "spice",
    label: "Spice level",
    required: true,
    selectionType: "single",
    options: [
      { id: "spice-mild", label: "Mild" },
      { id: "spice-medium", label: "Medium" },
      { id: "spice-hot", label: "Hot" },
    ],
  },
];

export function getVariantGroups(item: MenuItem): VariantGroup[] {
  const c = item.category.toLowerCase();
  if (c.includes("drink")) return DRINK_VARIANTS;
  if (c.includes("main")) return MAIN_VARIANTS;
  return [];
}
