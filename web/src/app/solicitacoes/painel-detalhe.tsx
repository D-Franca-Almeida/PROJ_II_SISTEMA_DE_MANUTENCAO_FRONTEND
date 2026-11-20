"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert, X } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { DeadlineChip } from "@/components/deadline-chip";
import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { formatarDataHora } from "@/lib/format";
import { ApiError } from "@/lib/http";
import {
  detalheSolicitacao,
  solicitacaoKeys,
  useAprovar,
  useCancelar,
  useDevolver,
} from "@/lib/solicitacoes/queries";
import {
  MOTIVO_MAX,
  type Solicitacao,
  STATUS_LABEL,
  STATUSES_CANCELAVEIS,
  STATUSES_EM_TRIAGEM,
} from "@/lib/solicitacoes/types";

type Props = {
  /** Request to show, or null to close the panel. */
  id: string | null;
  onClose: () => void;
};

export function PainelDetalhe({ id, onClose }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  // Keep the last request rendered while the panel slides out.
  const [mostrado, setMostrado] = useState<string | null>(null);
  if (id && mostrado !== id) setMostrado(id);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (id && !elemento.open) {
      elemento.showModal();
      // Start focus on the panel itself (announces its title) instead of ringing the close button.
      elemento.focus();
    }
    if (!id && elemento.open) elemento.close();
  }, [id]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the click only handles the backdrop; Esc is native to <dialog>.
    <dialog
      ref={dialogo}
      className="drawer"
      tabIndex={-1}
      aria-labelledby={tituloId}
      onClose={(evento) => {
        // The confirmation modals are nested here; only react to the panel's own close.
        if (evento.target === evento.currentTarget && id) onClose();
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget)
          evento.currentTarget.close();
      }}
    >
      {mostrado && (
        <Conteudo
          key={mostrado}
          id={mostrado}
          tituloId={tituloId}
          onFechar={() => dialogo.current?.close()}
        />
      )}
    </dialog>
  );
}

const mensagemDoDetalhe = (erro: Error | null) =>
  erro instanceof ApiError && erro.status === 404
    ? "Esta solicitação não existe ou foi removida."
    : (erro?.message ?? "Erro desconhecido.");

function Conteudo({
  id,
  tituloId,
  onFechar,
}: {
  id: string;
  tituloId: string;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const [confirmacao, setConfirmacao] = useState<string | null>(null);

  const consulta = useQuery({
    ...detalheSolicitacao(id),
    // Opened from the grid: show that row's data at once while the request is
    // fetched. The row is the full request, so nothing is missing meanwhile.
    placeholderData: () =>
      queryClient
        .getQueriesData<Solicitacao[]>({ queryKey: solicitacaoKeys.listas() })
        .flatMap(([, itens]) => itens ?? [])
        .find((s) => s.id === id),
  });
  const solicitacao = consulta.data ?? null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-line py-4 pr-4 pl-6">
        <div className="min-w-0 flex-1">
          <h2
            id={tituloId}
            className="tnum text-[1.25rem] font-bold leading-tight"
          >
            {id}
          </h2>
          {solicitacao && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={solicitacao.status} />
              {solicitacao.expiraEm && (
                <DeadlineChip expiraEm={solicitacao.expiraEm} />
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Fechar detalhe"
          onClick={onFechar}
        >
          <X size={20} aria-hidden="true" className="shrink-0" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {consulta.isPending && (
          <div aria-hidden="true" className="grid gap-4">
            <span className="skeleton h-[240px] w-full rounded-md" />
            <span className="skeleton w-2/3" />
            <span className="skeleton w-1/2" />
            <span className="skeleton w-3/4" />
          </div>
        )}

        {consulta.isError && !solicitacao && (
          <div role="alert">
            <p className="text-[0.9375rem] font-semibold">
              Não foi possível abrir a solicitação.
            </p>
            <p className="mt-1 text-ink-muted">
              {mensagemDoDetalhe(consulta.error)}
            </p>
          </div>
        )}

        {solicitacao && <Detalhe solicitacao={solicitacao} />}
      </div>

      {confirmacao && (
        <output className="shrink-0 border-t border-line px-6 py-4 font-semibold">
          {confirmacao}
        </output>
      )}

      {solicitacao && (
        <Acoes solicitacao={solicitacao} onFeito={setConfirmacao} />
      )}
    </div>
  );
}

function Detalhe({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return (
    <div className="grid gap-6">
      {s.status === "DEVOLVIDA" && s.motivoDevolucao && (
        <section className="rounded-md border border-rust px-4 py-3 shadow-[inset_4px_0_0_var(--color-rust)]">
          <h3 className="text-[0.9375rem] font-semibold text-rust-ink">
            Motivo da devolução
          </h3>
          <p className="mt-1 whitespace-pre-wrap break-words">
            {s.motivoDevolucao}
          </p>
        </section>
      )}

      {s.fotoUrl ? (
        // biome-ignore lint/performance/noImgElement: photos will come from the backend's own storage, whose host is not known yet for next/image.
        <img
          src={s.fotoUrl}
          alt={`Foto do equipamento ${s.equipamento.codigo} enviada pelo solicitante`}
          className="aspect-[4/3] w-full rounded-md border border-line bg-neutral-fill object-cover"
        />
      ) : (
        <p className="flex aspect-[4/3] w-full items-center justify-center rounded-md border border-dashed border-line-strong text-ink-muted">
          Solicitação sem foto.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Campo rotulo="Equipamento" largo>
          <span className="tnum font-semibold">{s.equipamento.codigo}</span>
          {" - "}
          {s.equipamento.descricao}
        </Campo>
        <Campo rotulo="Estação / localidade" largo>
          {s.localidade.codigo} - {s.localidade.nome}
        </Campo>
        <Campo rotulo="Avaria">{s.avaria}</Campo>
        <Campo rotulo="Aberta em">
          <span className="tnum">{formatarDataHora(s.abertaEm)}</span>
        </Campo>
        <Campo rotulo="Descrição do problema" largo>
          <span className="whitespace-pre-wrap break-words">{s.descricao}</span>
        </Campo>
        <Campo rotulo="Solicitante" largo>
          {s.solicitante.nome}{" "}
          <span className="tnum text-ink-muted">
            · matrícula {s.solicitante.matricula}
          </span>
        </Campo>
      </dl>

      <section>
        <h3 className="text-[0.9375rem] font-semibold">Histórico</h3>
        <ol className="mt-2 border-t border-line">
          {/* Newest first: the last decision is what the admin looks for. */}
          {s.historico.toReversed().map((evento) => (
            <li
              key={`${evento.data}-${evento.status}`}
              className="border-b border-line py-2.5"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold">
                  {STATUS_LABEL[evento.status]}
                </span>
                <span className="tnum shrink-0 text-[0.8125rem] text-ink-muted">
                  {formatarDataHora(evento.data)}
                </span>
              </div>
              <p className="text-[0.8125rem] text-ink-muted">
                por {evento.autor.nome}
              </p>
              {evento.motivo && (
                <p className="mt-1 whitespace-pre-wrap break-words">
                  Motivo: {evento.motivo}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Campo({
  rotulo,
  largo,
  children,
}: {
  rotulo: string;
  largo?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={largo ? "col-span-2" : ""}>
      <dt className="text-[0.8125rem] text-ink-muted">{rotulo}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function MensagemErro({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-2 font-semibold text-danger"
    >
      <span className="mt-0.5">
        <TriangleAlert size={16} aria-hidden="true" className="shrink-0" />
      </span>
      {children}
    </p>
  );
}

function Acoes({
  solicitacao,
  onFeito,
}: {
  solicitacao: Solicitacao;
  /** Called with the confirmation line once an action has gone through. */
  onFeito: (mensagem: string) => void;
}) {
  const { id, status } = solicitacao;
  const podeTriar = STATUSES_EM_TRIAGEM.includes(status);
  const podeCancelar = STATUSES_CANCELAVEIS.includes(status);

  const aprovar = useAprovar();
  const devolver = useDevolver();
  const cancelar = useCancelar();

  const [modal, setModal] = useState<"devolver" | "cancelar" | null>(null);
  const [motivo, setMotivo] = useState("");
  /** Caught here before asking the server; the server's own refusal is `devolver.error`. */
  const [erroMotivo, setErroMotivo] = useState<string | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const motivoId = useId();
  const ajudaId = useId();
  const erroId = useId();

  if (!podeTriar && !podeCancelar) return null;

  const ocupado = aprovar.isPending || devolver.isPending || cancelar.isPending;
  const erroDevolver = erroMotivo ?? devolver.error?.message ?? null;

  const fecharModal = () => {
    setModal(null);
    setErroMotivo(null);
    devolver.reset();
    cancelar.reset();
  };

  const enviarDevolucao = (evento: FormEvent) => {
    evento.preventDefault();
    const texto = motivo.trim();
    if (!texto) {
      setErroMotivo("Informe o motivo da devolução.");
      campo.current?.focus();
      return;
    }
    devolver.mutate(
      { id, motivo: texto },
      {
        onSuccess: () => {
          setModal(null);
          onFeito("Solicitação devolvida para correção.");
        },
      },
    );
  };

  return (
    <div className="grid shrink-0 gap-3 border-t border-line px-6 py-4">
      {aprovar.error && <MensagemErro>{aprovar.error.message}</MensagemErro>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {podeCancelar && (
          <button
            type="button"
            className="btn btn-ghost mr-auto"
            disabled={ocupado}
            onClick={() => setModal("cancelar")}
          >
            Cancelar solicitação
          </button>
        )}
        {podeTriar && (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={ocupado}
              onClick={() => setModal("devolver")}
            >
              Devolver para correção
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={ocupado}
              onClick={() =>
                aprovar.mutate(id, {
                  onSuccess: () => onFeito("Solicitação aprovada."),
                })
              }
            >
              {aprovar.isPending ? "Aprovando…" : "Aprovar"}
            </button>
          </>
        )}
      </div>

      <Modal
        open={modal === "devolver"}
        onClose={fecharModal}
        titulo={`Devolver ${id} para correção`}
        bloqueado={ocupado}
      >
        <form onSubmit={enviarDevolucao} noValidate className="mt-4 grid gap-3">
          <div>
            <label htmlFor={motivoId} className="field-label">
              Motivo da devolução
            </label>
            <textarea
              ref={campo}
              id={motivoId}
              className="textarea"
              value={motivo}
              required
              maxLength={MOTIVO_MAX}
              disabled={ocupado}
              aria-invalid={erroDevolver ? true : undefined}
              aria-describedby={erroDevolver ? `${erroId} ${ajudaId}` : ajudaId}
              placeholder="Ex.: a foto não mostra a etiqueta do equipamento"
              onChange={(evento) => {
                setMotivo(evento.target.value);
                setErroMotivo(null);
                devolver.reset();
              }}
            />
            <div className="mt-1 flex justify-between gap-4 text-[0.8125rem] text-ink-muted">
              <span id={ajudaId}>
                Obrigatório. O solicitante vai ler este texto.
              </span>
              <span className="tnum">
                {motivo.length}/{MOTIVO_MAX}
              </span>
            </div>
          </div>
          {erroDevolver && (
            <MensagemErro id={erroId}>{erroDevolver}</MensagemErro>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={ocupado}
              onClick={fecharModal}
            >
              Voltar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={ocupado}
            >
              {devolver.isPending ? "Devolvendo…" : "Devolver solicitação"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal === "cancelar"}
        onClose={fecharModal}
        titulo={`Cancelar ${id}?`}
        bloqueado={ocupado}
      >
        <p className="mt-2 text-ink-muted">
          A solicitação sai da triagem e não segue para a oficina. Esta ação não
          pode ser desfeita.
        </p>
        {cancelar.error && (
          <div className="mt-3">
            <MensagemErro>{cancelar.error.message}</MensagemErro>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={ocupado}
            onClick={fecharModal}
          >
            Voltar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={ocupado}
            onClick={() =>
              cancelar.mutate(id, {
                onSuccess: () => {
                  setModal(null);
                  onFeito("Solicitação cancelada.");
                },
              })
            }
          >
            {cancelar.isPending ? "Cancelando…" : "Cancelar solicitação"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
