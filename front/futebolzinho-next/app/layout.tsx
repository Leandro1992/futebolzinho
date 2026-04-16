import type { Metadata } from "next";
import "@/app/globals.css";
import { AuthProvider } from "@/components/auth-context";

export const metadata: Metadata = {
  title: "Futebolzinho Next",
  description: "Aplicacao Next.js para gestao das partidas Futebolzinho",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
