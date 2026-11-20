import type { ReactNode } from "react";

/** The three non-data states every list shares, so they read the same on every page. */

export function ListaErro({
  titulo,
  mensagem,
  onTentarNovamente,
}: {
  titulo: string;
  mensagem: string;
  onTentarNovamente: () => void;
}) {
  return (
    <div role="alert" className="px-6 py-12">
      <h2 className="text-[1.25rem] font-bold leading-tight">{titulo}</h2>
      <p className="mt-1 text-ink-muted">{mensagem}</p>
      <button
        type="button"
        className="btn btn-secondary mt-4"
        onClick={onTentarNovamente}
      >
        Tentar novamente
      </button>
    </div>
  );
}

export function ListaVazia({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto: string;
  /** Usually a link that clears the filter. */
  acao?: ReactNode;
}) {
  return (
    <div className="px-6 py-12">
      <h2 className="text-[1.25rem] font-bold leading-tight">{titulo}</h2>
      <p className="mt-1 max-w-[70ch] text-ink-muted">{texto}</p>
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}

const LINHAS = ["a", "b", "c", "d", "e", "f"];

/** Placeholder rows at the real row height; one width per column. */
export function LinhasEsqueleto({ larguras }: { larguras: number[] }) {
  return (
    <tbody aria-hidden="true">
      {LINHAS.map((linha) => (
        <tr key={linha}>
          {larguras.map((largura, coluna) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: columns are a fixed, never-reordered list.
            <td key={coluna}>
              <span className="skeleton" style={{ width: largura }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
