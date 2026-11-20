"use client";

import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { entrarNaApi } from "@/lib/login-api";
import { inicioDe } from "@/lib/navegacao";
import { salvarSessao, useSessao } from "@/lib/session";

type Erros = { email?: string; senha?: string };

export function FormularioLogin() {
  const router = useRouter();
  const sessao = useSessao();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const entrar = useMutation({
    mutationFn: (dados: { email: string; senha: string }) =>
      entrarNaApi(dados.email, dados.senha),
    // The effect below redirects once the session is stored.
    onSuccess: salvarSessao,
  });
  // Stays true after success until the redirect lands, so it cannot be sent twice.
  const enviando = entrar.isPending || entrar.isSuccess;
  const [erros, setErros] = useState<Erros>({});
  const campoEmail = useRef<HTMLInputElement>(null);
  const campoSenha = useRef<HTMLInputElement>(null);
  const id = useId();

  // Already signed in (or just signed in): go to the profile's start page.
  useEffect(() => {
    const inicio = sessao ? inicioDe(sessao.usuario.perfil) : null;
    if (inicio) router.replace(inicio);
  }, [sessao, router]);

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();

    const novos: Erros = {};
    if (!email.trim()) novos.email = "Informe seu e-mail.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      novos.email = "Este e-mail não parece válido. Ex.: nome@cptm.sp.gov.br";
    if (!senha) novos.senha = "Informe sua senha.";
    if (novos.email || novos.senha) {
      setErros(novos);
      (novos.email ? campoEmail : campoSenha).current?.focus();
      return;
    }

    setErros({});
    entrar.mutate({ email: email.trim(), senha });
  };

  return (
    <form onSubmit={enviar} noValidate className="mt-6 grid gap-4">
      <div>
        <label htmlFor={`${id}-email`} className="field-label">
          E-mail
        </label>
        <input
          ref={campoEmail}
          id={`${id}-email`}
          className="input input-lg"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          disabled={enviando}
          aria-invalid={erros.email ? true : undefined}
          aria-describedby={erros.email ? `${id}-email-erro` : undefined}
          onChange={(evento) => {
            setEmail(evento.target.value);
            setErros((atual) => ({ ...atual, email: undefined }));
          }}
        />
        {erros.email && (
          <p id={`${id}-email-erro`} className="field-error">
            {erros.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-senha`} className="field-label">
          Senha
        </label>
        <div className="relative">
          <input
            ref={campoSenha}
            id={`${id}-senha`}
            className="input input-lg pr-11"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            value={senha}
            disabled={enviando}
            aria-invalid={erros.senha ? true : undefined}
            aria-describedby={erros.senha ? `${id}-senha-erro` : undefined}
            onChange={(evento) => {
              setSenha(evento.target.value);
              setErros((atual) => ({ ...atual, senha: undefined }));
            }}
          />
          <button
            type="button"
            className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-sm text-ink-muted hover:text-ink"
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={mostrarSenha}
            onClick={() => setMostrarSenha((atual) => !atual)}
          >
            {mostrarSenha ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </div>
        {erros.senha && (
          <p id={`${id}-senha-erro`} className="field-error">
            {erros.senha}
          </p>
        )}
      </div>

      {entrar.error && (
        <p
          role="alert"
          className="flex items-start gap-2 font-semibold text-danger"
        >
          <TriangleAlert
            size={16}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
          {entrar.error.message}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg mt-2 w-full"
        disabled={enviando}
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center text-[0.8125rem] text-ink-muted">
        Sem acesso ou esqueceu a senha? Fale com a administração do sistema.
      </p>
      <p className="text-center text-[0.8125rem] text-ink-muted">
        MODO MOCK — use admin@cptm.example ou logistica@cptm.example com a senha
        “senha”.
      </p>
    </form>
  );
}
