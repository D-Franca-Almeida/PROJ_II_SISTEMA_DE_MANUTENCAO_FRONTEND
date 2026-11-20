import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { Fila } from "./fila";

export const metadata: Metadata = { title: "Solicitações" };

export default function SolicitacoesPage() {
  return (
    <AppShell>
      <Suspense>
        <Fila />
      </Suspense>
    </AppShell>
  );
}
