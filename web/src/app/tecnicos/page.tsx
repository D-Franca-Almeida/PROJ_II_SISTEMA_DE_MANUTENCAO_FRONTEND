import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { Tecnicos } from "./tecnicos";

export const metadata: Metadata = { title: "Técnicos" };

export default function TecnicosPage() {
  return (
    <AppShell>
      <Tecnicos />
    </AppShell>
  );
}
