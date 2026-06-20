// Dummy content for the rich customer dashboard. Real wallet/points/name come
// from Supabase; these are visual placeholders (Unsplash imagery).

export type Promo = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  accent: string; // tailwind gradient "from-*" overlay tint
};

export const PROMOS: Promo[] = [
  {
    id: "p1",
    title: "New Steamboat Combos",
    subtitle: "Feast for 2 from RM58",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=70",
    accent: "from-rose-950/80",
  },
  {
    id: "p2",
    title: "Happy Hour Drinks",
    subtitle: "2–5pm · 30% off all drinks",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=70",
    accent: "from-amber-950/80",
  },
  {
    id: "p3",
    title: "Truffle Pasta Week",
    subtitle: "Chef's special at the Bistro",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=70",
    accent: "from-slate-950/80",
  },
];

export type PopularItem = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export const POPULAR: PopularItem[] = [
  {
    id: "m1",
    name: "Signature Latté",
    price: 12.9,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "m2",
    name: "Mala Steamboat",
    price: 52.0,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "m3",
    name: "Truffle Pasta",
    price: 26.9,
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "m4",
    name: "Iced Matcha",
    price: 15.9,
    image:
      "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=600&q=70",
  },
];

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  kind: string; // 'free_item' | 'voucher'
  value: number | null;
};

// Fallback catalog shown only when Supabase isn't configured. Real rewards come
// from public.loyalty_rewards (with real UUIDs that redeem_reward accepts).
export const DEMO_REWARDS: Reward[] = [
  { id: "r1", name: "Free Dessert", description: "A sweet treat on the house", points_cost: 350, kind: "free_item", value: null },
  { id: "r2", name: "Free Signature Drink", description: "Any signature drink, on us", points_cost: 500, kind: "free_item", value: null },
  { id: "r3", name: "RM10 Voucher", description: "RM10 off your next order", points_cost: 1000, kind: "voucher", value: 10 },
  { id: "r4", name: "RM25 Voucher", description: "RM25 off your next order", points_cost: 2000, kind: "voucher", value: 25 },
];

export type PastOrder = {
  id: string;
  outlet: string;
  items: string;
  total: number;
  image: string;
};

export const PAST_ORDERS: PastOrder[] = [
  {
    id: "o1",
    outlet: "BizCafé Bistro",
    items: "Truffle Pasta, Iced Matcha",
    total: 42.8,
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=300&q=70",
  },
  {
    id: "o2",
    outlet: "BizCafé Steamboat",
    items: "Mala Pot, Iced Barley ×2",
    total: 65.0,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=300&q=70",
  },
  {
    id: "o3",
    outlet: "BizCafé Bistro",
    items: "Signature Latté",
    total: 12.9,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=70",
  },
];
