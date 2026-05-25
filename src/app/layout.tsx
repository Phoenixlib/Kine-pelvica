import "~/styles/globals.css";

import { type Metadata } from "next";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Estudio Pélvico Camila Ortiz | Kinesiología Uroginecológica y Obstétrica",
  description: "Especialista en uroginecología, embarazo, postparto, sexualidad terapéutica y tratamiento integral de cicatrices en adultos, niños y embarazadas.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="min-h-screen font-body text-teal bg-offwhite selection:bg-terracotta selection:text-white relative antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
