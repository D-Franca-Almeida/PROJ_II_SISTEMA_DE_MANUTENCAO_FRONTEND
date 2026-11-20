import { z } from "zod";
import { objeto } from "@/lib/validacao";

const EMAIL_VAZIO = "Informe o e-mail.";

/** Body of POST /api/auth/login. The password is never trimmed. */
export const login = objeto({
  email: z
    .string({ error: EMAIL_VAZIO })
    .trim()
    .min(1, EMAIL_VAZIO)
    .pipe(z.email({ error: "Informe um e-mail válido." })),
  senha: z.string({ error: "Informe a senha." }).min(1, "Informe a senha."),
});
