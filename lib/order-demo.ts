import type { MenuItem, Outlet } from "./order-types";

// Demo data used as a fallback so the ordering flow is fully explorable before
// Supabase is wired up. Real data comes from the `outlets` / `menu_items` tables.

export const DEMO_OUTLETS: Outlet[] = [
  {
    id: "demo-bistro",
    name: "BizCafé Bistro",
    address: "Level 2, Pavilion KL",
    kind: "Bistro",
    emoji: "🍽️",
  },
  {
    id: "demo-steamboat",
    name: "BizCafé Steamboat",
    address: "LG Floor, Sunway Pyramid",
    kind: "Steamboat",
    emoji: "🍲",
  },
];

type Row = [name: string, description: string, category: string, price: number, emoji: string];

function build(outletId: string, prefix: string, rows: Row[]): MenuItem[] {
  return rows.map(([name, description, category, price, emoji], i) => ({
    id: `${prefix}-${i}`,
    outletId,
    name,
    description,
    category,
    price,
    emoji,
    isAvailable: true,
  }));
}

export const DEMO_MENU_BY_OUTLET: Record<string, MenuItem[]> = {
  "demo-bistro": build("demo-bistro", "b", [
    ["Truffle Mushroom Pasta", "Creamy tagliatelle, parmesan, black truffle", "Mains", 26.9, "🍝"],
    ["Grilled Chicken Chop", "Herb-marinated chicken, black pepper sauce, fries", "Mains", 23.5, "🍗"],
    ["Beef Bolognese", "Slow-cooked beef ragù, fresh basil", "Mains", 24.9, "🍖"],
    ["Signature Latté", "House espresso, velvety steamed milk", "Drinks", 12.9, "☕"],
    ["Iced Matcha", "Ceremonial-grade matcha, fresh milk", "Drinks", 15.9, "🍵"],
    ["Fresh Orange Juice", "Cold-pressed daily", "Drinks", 11.0, "🍊"],
    ["Garlic Bread", "Toasted ciabatta, garlic butter", "Add-ons", 8.0, "🥖"],
    ["Truffle Fries", "Shoestring fries, truffle oil, parmesan", "Add-ons", 12.0, "🍟"],
    ["Extra Cheese", "Melted mozzarella", "Add-ons", 4.0, "🧀"],
  ]),
  "demo-steamboat": build("demo-steamboat", "s", [
    ["Tom Yum Steamboat Set", "Spicy & sour broth, seafood platter (2 pax)", "Mains", 58.0, "🍲"],
    ["Herbal Chicken Pot", "Nourishing herbal broth, free-range chicken", "Mains", 48.0, "🍗"],
    ["Mala Spicy Pot", "Sichuan mala broth — numbing & spicy", "Mains", 52.0, "🌶️"],
    ["Iced Barley", "Homemade, lightly sweet", "Drinks", 6.5, "🥤"],
    ["Soya Milk", "Freshly ground", "Drinks", 6.0, "🥛"],
    ["Iced Lemon Tea", "Brewed black tea, fresh lemon", "Drinks", 7.5, "🍋"],
    ["Fishball Platter", "Assorted handmade fishballs", "Add-ons", 14.0, "🐟"],
    ["Enoki Mushroom", "Fresh enoki bundle", "Add-ons", 9.0, "🍄"],
    ["Handmade Noodles", "Springy egg noodles", "Add-ons", 7.0, "🍜"],
  ]),
};
