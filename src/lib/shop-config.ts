// ---------- TIPOS ----------
export type CoinPackIcon =
  | "bronze"
  | "silver"
  | "gold"
  | "diamond"
  | "legendary";

export type SubscriptionIcon =
  | "zap"
  | "sparkles"
  | "crown"
  | "diamond";

export interface CoinPack {
  label: string;
  premium: number;
  lite: number;
  price: number;
  icon: CoinPackIcon;
  popular?: boolean;
  legendary?: boolean;
}

export interface SubscriptionPlan {
  label: string;
  price: number;
  monthlyPaws: number;
  priceId: string;
  discount: number;
  works: number;
  icon: SubscriptionIcon;
  recommended?: boolean;
}

// ---------- COIN PACKS ----------
export const COIN_PACKS: Record<string, CoinPack> = {
  pack_handful: {
    label: "Punhado",
    premium: 10,
    lite: 1,
    price: 599,
    icon: "bronze",
  },
  pack_bag: {
    label: "Saco",
    premium: 20,
    lite: 2,
    price: 999,
    icon: "silver",
  },
  pack_chest: {
    label: "Baú",
    premium: 30,
    lite: 5,
    price: 1499,
    icon: "gold",
    popular: true,
  },
  pack_treas: {
    label: "Tesouro",
    premium: 50,
    lite: 12,
    price: 2599,
    icon: "diamond",
  },
  pack_hoard: {
    label: "Hoard",
    premium: 100,
    lite: 30,
    price: 4599,
    icon: "legendary",
    legendary: true,
  },
};

// ---------- SUBSCRIPTIONS ----------
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  sub_bronze: {
    label: "Bronze",
    priceId: "price_1Sn7jzI2ktaLUyE9ApQIxpPL",
    price: 699,
    monthlyPaws: 10,
    discount: 5,
    works: 1,
    icon: "zap",
  },
  sub_silver: {
    label: "Prata",
    priceId: "price_1Sn7kXI2ktaLUyE9jAeIZgk5",
    price: 1499,
    monthlyPaws: 15,
    discount: 8,
    works: 2,
    icon: "sparkles",
  },
  sub_gold: {
    label: "Ouro",
    priceId: "price_1Sn7kvI2ktaLUyE9eQ9xS4g9",
    price: 2599,
    monthlyPaws: 20,
    discount: 10,
    works: 3,
    icon: "crown",
    recommended: true,
  },
  sub_platinum: {
    label: "Diamante",
    priceId: "price_1Sn7lSI2ktaLUyE9exSkWBSb",
    price: 3599,
    monthlyPaws: 30,
    discount: 15,
    works: 7,
    icon: "diamond",
  },
};
