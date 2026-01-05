'use client'; // <--- Isso permite usar useState e eventos onError

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function WorkImage({ src, alt, className }: WorkImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={cn("flex items-center justify-center bg-zinc-900 border border-zinc-700", className)}>
        <ImageIcon className="w-6 h-6 text-zinc-600" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={src} 
      alt={alt}
      className={cn("object-cover w-full h-full", className)}
      onError={() => setHasError(true)} 
    />
  );
}