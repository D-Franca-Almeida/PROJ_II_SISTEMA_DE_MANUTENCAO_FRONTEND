import { Clock, TriangleAlert } from "lucide-react";
import { descreverPrazo } from "@/lib/format";

export function DeadlineChip({ expiraEm }: { expiraEm: string }) {
  const prazo = descreverPrazo(expiraEm);
  return (
    <span className={`chip ${prazo.urgente ? "chip-danger" : ""}`}>
      {prazo.urgente ? (
        <TriangleAlert size={14} aria-hidden="true" className="shrink-0" />
      ) : (
        <Clock size={14} aria-hidden="true" className="shrink-0" />
      )}
      {prazo.texto}
    </span>
  );
}
