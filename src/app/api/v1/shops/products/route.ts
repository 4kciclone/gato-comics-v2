import { NextResponse } from "next/server";
import { COIN_PACKS, SUBSCRIPTION_PLANS } from "@/lib/shop-config";

export async function GET(req: Request) {
  try {
    // Transforma o Objeto/Record em Array para facilitar o uso no FlatList do React Native
    
    const coinPacksArray = Object.entries(COIN_PACKS).map(([key, pack]) => ({
      id: key,
      ...pack,
    }));

    const subscriptionsArray = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
    }));

    return NextResponse.json({
      coinPacks: coinPacksArray,
      subscriptions: subscriptionsArray,
    });

  } catch (error) {
    console.error("Erro ao carregar loja:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}