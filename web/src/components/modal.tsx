"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  /** Asked to close by Esc, the backdrop or a button. Ignored while `bloqueado`. */
  onClose: () => void;
  titulo: string;
  /** True while a request is in flight, so the modal cannot be dismissed mid-save. */
  bloqueado?: boolean;
  children: ReactNode;
};

/**
 * Centered confirmation dialog on the native <dialog>, which provides the
 * focus trap, Esc and the top layer (so it stacks above the detail panel).
 */
export function Modal({ open, onClose, titulo, bloqueado, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (open && !elemento.open) elemento.showModal();
    if (!open && elemento.open) elemento.close();
  }, [open]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the click only handles the backdrop; Esc is native to <dialog>.
    <dialog
      ref={dialogo}
      className="modal"
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        if (bloqueado) evento.preventDefault();
      }}
      onClose={(evento) => {
        // `close` from this dialog only; never react to a nested one.
        if (evento.target === evento.currentTarget && open) onClose();
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget && !bloqueado) onClose();
      }}
    >
      <div className="p-6">
        <h2 id={tituloId} className="text-[1.25rem] font-bold leading-tight">
          {titulo}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
