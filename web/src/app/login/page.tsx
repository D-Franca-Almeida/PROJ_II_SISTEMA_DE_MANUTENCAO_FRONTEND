import type { Metadata } from "next";
import Image from "next/image";
import logoCptm from "@/assets/Cptm_icon.svg.webp";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="on-red flex min-h-dvh flex-col items-center justify-center bg-cptm-red px-4 py-12">
      <div className="flex flex-col items-center text-white">
        <span className="flex size-16 items-center justify-center rounded-full bg-white">
          <Image
            src={logoCptm}
            alt=""
            sizes="40px"
            priority
            className="h-auto w-10"
          />
        </span>
        <p className="mt-4 text-[2.5rem] font-extrabold leading-none tracking-[-0.01em]">
          CPTM
        </p>
        <p className="mt-2 text-[1.0625rem] leading-none">SSL · Manutenção</p>
      </div>

      <div className="mt-8 w-full max-w-[400px] rounded-lg bg-surface p-6 text-ink">
        <h1 className="text-[1.25rem] font-bold leading-tight">Entrar</h1>
        <p className="mt-1 text-ink-muted">Use seu e-mail e senha da CPTM.</p>
        <FormularioLogin />
      </div>
    </main>
  );
}
