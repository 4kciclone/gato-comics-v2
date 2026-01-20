import { LEGAL_TEXTS } from "@/lib/legal-text";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12 space-y-4">
        <div className="w-16 h-16 bg-[#FFD700]/10 rounded-full flex items-center justify-center mx-auto text-[#FFD700]">
          <ScrollText className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-white">Termos de Uso</h1>
        <p className="text-zinc-400">Última atualização: Janeiro de 2026</p>
      </div>

      <Card className="bg-[#111] border-[#27272a]">
        <CardContent className="p-8">
          <div className="prose prose-invert max-w-none text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {LEGAL_TEXTS.terms}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}