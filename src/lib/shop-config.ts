export const COIN_PACKS = {
  "pack_handful": { label: "Punhado", premium: 10, lite: 1, price: 599, icon: "bronze" },
  "pack_bag":     { label: "Saco",    premium: 20, lite: 2, price: 999, icon: "silver" },
  "pack_chest":   { label: "Baú",     premium: 30, lite: 5, price: 1499, icon: "gold", popular: true },
  "pack_treas":   { label: "Tesouro", premium: 50, lite: 12, price: 2599, icon: "diamond" },
  "pack_hoard":   { label: "Hoard",   premium: 100, lite: 30, price: 4599, icon: "legendary", legendary: true },
};

export const SUBSCRIPTION_PLANS = {
  "sub_bronze":   { label: "Bronze",      price: 699,  monthlyPaws: 10, discount: 5,  works: 1, icon: "zap" },
  "sub_silver":   { label: "Prata",       price: 1499, monthlyPaws: 15, discount: 8,  works: 2, icon: "sparkles" },
  "sub_gold":     { label: "Ouro",        price: 2599, monthlyPaws: 20, discount: 10, works: 3, icon: "crown", recommended: true },
  "sub_platinum": { label: "Rei Platina", price: 3599, monthlyPaws: 30, discount: 15, works: 7, icon: "diamond" }, 
};