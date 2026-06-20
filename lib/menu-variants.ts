import type { MenuItem } from "./order-types";

export type VariantOption = { label: string; priceDelta?: number };
export type VariantGroup = {
  id: string;
  label: string;
  required?: boolean;
  options: VariantOption[];
};

// For now variant groups are derived from the item's category. Later these can
// come from the database (e.g. a JSONB `variants` column on menu_items synced
// from your POS).
const DRINK_VARIANTS: VariantGroup[] = [
  {
    id: "size",
    label: "Size",
    required: true,
    options: [{ label: "Regular" }, { label: "Large", priceDelta: 2 }],
  },
  {
    id: "ice",
    label: "Ice level",
    required: true,
    options: [{ label: "Normal" }, { label: "Less ice" }, { label: "No ice" }],
  },
  {
    id: "sugar",
    label: "Sugar level",
    required: true,
    options: [
      { label: "100%" },
      { label: "50%" },
      { label: "25%" },
      { label: "0%" },
    ],
  },
];

const MAIN_VARIANTS: VariantGroup[] = [
  {
    id: "spice",
    label: "Spice level",
    required: true,
    options: [{ label: "Mild" }, { label: "Medium" }, { label: "Hot" }],
  },
];

export function getVariantGroups(item: MenuItem): VariantGroup[] {
  const c = item.category.toLowerCase();
  if (c.includes("drink")) return DRINK_VARIANTS;
  if (c.includes("main")) return MAIN_VARIANTS;
  return [];
}
