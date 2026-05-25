import { cn } from "../utils";
import React from 'react';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: "normal" | "small";
}

export function LogoSVG({ className, size = "normal", ...props }: LogoProps) {
  const isSmall = size === "small";
  return (
    <div className={cn("flex flex-col items-center", className)} {...props}>
      <img
        src="/logo-editado.png"
        alt="Estudio Pélvico"
        className={cn(
          "w-auto object-contain transition-transform", 
          isSmall ? "h-14 mb-2" : "h-28 md:h-36 lg:h-44 mb-4"
        )}
      />
    </div>
  );
}
