import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/actions/checkout";
import { COIN_PACKS, SUBSCRIPTION_PLANS } from "@/lib/shop-config";
import { PackCard, SubscriptionCard, ShopTabs } from "@/components/shop/shop-ui";
import { CosmeticCard } from "@/components/shop/cosmetic-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShieldCheck, Zap, Gem, PartyPopper, XCircle } from "lucide-react";

interface ShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ShopPage(props: ShopPageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  
  if (!session?.user) redirect("/login");

  const isSuccess = searchParams.success === "true";
  const isCanceled = searchParams.canceled === "true";

  // BUSCA DE DADOS UNIFICADA: Cosméticos e dados do usuário
  const [cosmetics, userInventory, user] = await Promise.all([
    prisma.cosmetic.findMany({
      where: { isActive: true },
      orderBy: [{ rarity: 'desc' }, { price: 'asc' }],
    }),
    prisma.userCosmetic.findMany({
      where: { userId: session.user.id },
      select: { cosmeticId: true },
    }),
    prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balancePremium: true, image: true, name: true }
    })
  ]);

  if (!user) redirect("/login");

  const ownedCosmeticIds = new Set(userInventory.map(item => item.cosmeticId));
  const userAvatarUrl = user.image || `https://ui-avatars.com/api/?name=${user.name || 'G'}&background=111111&color=FFD700`;

  return (
    <div className="min-h-screen bg-[#050505] pb-24">
      
      {/* HERO SECTION */}
      <div className="relative bg-[#111111] border-b border-[#27272a] py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505]" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <Zap className="w-3 h-3 fill-current" /> Loja Oficial
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">
            COFRE DA <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FFA500]">GUILDA</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Desbloqueie capítulos, apoie seus autores favoritos e personalize sua identidade na comunidade.
          </p>
        </div>
      </div>

      {/* FEEDBACK MESSAGES */}
      <div className="container mx-auto px-4 mt-8">
        {isSuccess && (
          <div className="p-4 bg-green-900/20 border border-green-900 rounded-lg flex items-center justify-center gap-4 text-green-400 font-bold animate-in fade-in">
            <PartyPopper className="w-5 h-5" /> Pagamento confirmado! Seu saldo foi atualizado.
          </div>
        )}
        {isCanceled && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-900 rounded-lg flex items-center justify-center gap-4 text-yellow-400 font-bold animate-in fade-in">
            <XCircle className="w-5 h-5" /> A compra foi cancelada.
          </div>
        )}
      </div>

      {/* TABS E PRODUTOS */}
      <div className="container mx-auto px-4 mt-12 max-w-7xl">
        <ShopTabs 
          childrenPacks={
            <>
              {Object.entries(COIN_PACKS).map(([id, pack]) => (
                <PackCard 
                  key={id}
                  packId={id}
                  {...pack}
                  action={async () => { "use server"; await createCheckoutSession(id, 'pack'); }}
                />
              ))}
            </>
          }
          childrenSubs={
            <>
              {Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => (
                <SubscriptionCard 
                  key={id}
                  subId={id}
                  {...plan}
                  action={async () => { "use server"; await createCheckoutSession(id, 'sub'); }}
                />
              ))}
            </>
          }
          childrenCosmetics={
            <>
              {cosmetics.map((cosmetic) => (
                <CosmeticCard 
                  key={cosmetic.id}
                  cosmetic={cosmetic as any}
                  userBalance={user.balancePremium}
                  isOwned={ownedCosmeticIds.has(cosmetic.id)}
                  userAvatar={userAvatarUrl}
                />
              ))}
              {cosmetics.length === 0 && (
                <div className="col-span-full text-center py-20 text-zinc-500">
                   <Gem className="w-12 h-12 mx-auto mb-4 text-zinc-700"/>
                   Nenhum cosmético disponível no momento. Volte em breve!
                </div>
              )}
            </>
          }
        />
      </div>

      {/* FAQ & TRUST */}
      <div className="container mx-auto px-4 mt-32 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">Perguntas Frequentes</h2>
          <p className="text-zinc-500">Tudo o que você precisa saber sobre a economia do Gato.</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border border-[#27272a] bg-[#111] rounded-lg px-4">
            <AccordionTrigger className="text-white hover:text-[#FFD700] hover:no-underline">As Patinhas Premium expiram?</AccordionTrigger>
            <AccordionContent className="text-zinc-400">
              Não! Patinhas compradas com dinheiro real (Premium) são suas para sempre. Apenas as Patinhas Lite (ganhas em eventos/ads) expiram em 72h.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border border-[#27272a] bg-[#111] rounded-lg px-4">
            <AccordionTrigger className="text-white hover:text-[#FFD700] hover:no-underline">O desbloqueio de capítulo é permanente?</AccordionTrigger>
            <AccordionContent className="text-zinc-400">
              Sim! Ao usar Patinhas Premium, o capítulo é seu para sempre (Compra). Se usar Patinhas Lite, é um Aluguel de 72 horas.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="border border-[#27272a] bg-[#111] rounded-lg px-4">
            <AccordionTrigger className="text-white hover:text-[#FFD700] hover:no-underline">Posso cancelar a assinatura?</AccordionTrigger>
            <AccordionContent className="text-zinc-400">
              A qualquer momento. O cancelamento evita a renovação no próximo mês, mas você mantém os benefícios até o fim do ciclo de pagamento atual.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 flex items-center justify-center gap-8 text-zinc-500 text-sm grayscale opacity-50">
           <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> Pagamento Seguro SSL</div>
           <p>Stripe Processed</p>
           <p>Suporte 24/7</p>
        </div>
      </div>

    </div>
  );
}