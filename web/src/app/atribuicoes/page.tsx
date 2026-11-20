import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { Atribuicoes } from "./atribuicoes";

export const metadata: Metadata = { title: "SSL por técnico" };

export default function AtribuicoesPage() {
  return (
    <AppShell>
      <Suspense>
        <Atribuicoes />
      </Suspense>
    </AppShell>
  );
}
