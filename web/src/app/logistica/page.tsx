import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { PedidosPecas } from "./pedidos-pecas";

export const metadata: Metadata = { title: "Logística" };

export default function LogisticaPage() {
  return (
    <AppShell>
      <Suspense>
        <PedidosPecas />
      </Suspense>
    </AppShell>
  );
}
