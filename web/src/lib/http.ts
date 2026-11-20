import { encerrarSessao, getToken } from "@/lib/session";

/**
 * Browser-side HTTP client shared by every feature. Empty base URL means
 * "this app's own mock routes"; set NEXT_PUBLIC_API_BASE_URL to point at the
 * real backend.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Opcoes = RequestInit & {
  /** Login itself answers 401 for wrong credentials; that is not an expired session. */
  publico?: boolean;
};

export async function pedir<T>(caminho: string, opcoes?: Opcoes): Promise<T> {
  const { publico, ...init } = opcoes ?? {};
  const token = publico ? null : getToken();
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch (causa) {
    if (causa instanceof DOMException && causa.name === "AbortError") {
      throw causa;
    }
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão.",
      0,
    );
  }

  if (!resposta.ok) {
    // The session ended on the server: drop it here too. The app shell sees
    // the change and sends the user to the login page.
    if (resposta.status === 401 && !publico) encerrarSessao();

    const corpo = (await resposta.json().catch(() => null)) as {
      erro?: string;
    } | null;
    throw new ApiError(
      corpo?.erro ?? `O servidor respondeu com erro ${resposta.status}.`,
      resposta.status,
    );
  }
  return (await resposta.json()) as T;
}

export function postJson<T>(
  caminho: string,
  corpo: unknown,
  opcoes?: Opcoes,
): Promise<T> {
  return pedir(caminho, {
    ...opcoes,
    method: "POST",
    headers: { "Content-Type": "application/json", ...opcoes?.headers },
    body: JSON.stringify(corpo),
  });
}
