import Image from "next/image";
import { cn } from "@/lib/utils";

interface CurrencyIconProps {
  type: "premium" | "lite";
  className?: string;
  size?: number;
}

export function CurrencyIcon({ type, className, size = 20 }: CurrencyIconProps) {
  // Ajuste a extensão se suas imagens forem .webp ou .png
  const src = type === "premium" 
    ? "/assets/currency-premium.webp" 
    : "/assets/currency-lite.webp";

  const alt = type === "premium" ? "Patinha Premium" : "Patinha Lite";

  // --- O SEGREDINHO ESTÁ AQUI ---
  // Pegamos o tamanho que o local pediu (ex: 20) e multiplicamos por 2.
  // Assim, em todo lugar elas ficarão com o dobro do tamanho original.
  const finalSize = size * 2; 

  return (
    <div 
      className={cn("relative inline-block align-middle select-none", className)} 
      style={{ width: finalSize, height: finalSize }} // Aplica o tamanho dobrado
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain drop-shadow-sm"
        sizes={`${finalSize}px`}
        priority // Garante que carreguem rápido já que são ícones importantes
      />
    </div>
  );
}