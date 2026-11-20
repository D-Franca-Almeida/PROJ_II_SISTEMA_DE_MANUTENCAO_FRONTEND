import { z } from "zod";

/**
 * Request validation for the API routes, built on zod.
 *
 * Routes check the caller first (`autenticar`: 401, 403), then the shape of
 * the request here (400), and only then run the business rules (404, 400).
 * Every refusal is `{ erro }`, the same body the web client already reads.
 */

const NAO_E_OBJETO = "O corpo da requisição deve ser um objeto JSON.";

/** `z.object` that answers in Portuguese when the body is not an object at all. */
export const objeto = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape, { error: NAO_E_OBJETO });

type Lido<T> =
  | { dados: T; negado?: never }
  | { negado: Response; dados?: never };

/** 400 with the first problem found, in the order the fields are declared. */
function recusar(erro: z.ZodError): Response {
  return Response.json(
    { erro: erro.issues[0]?.message ?? "Requisição inválida." },
    { status: 400 },
  );
}

/** Parses the JSON body. A body that is missing or not valid JSON fails the schema. */
export async function lerCorpo<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<Lido<z.output<S>>> {
  const bruto: unknown = await request.json().catch(() => undefined);
  const resultado = schema.safeParse(bruto);
  return resultado.success
    ? { dados: resultado.data }
    : { negado: recusar(resultado.error) };
}

/** Parses the query string. An empty value (`?status=`) counts as absent. */
export function lerQuery<S extends z.ZodType>(
  request: Request,
  schema: S,
): Lido<z.output<S>> {
  const entradas = [...new URL(request.url).searchParams].filter(
    ([, valor]) => valor !== "",
  );
  const resultado = schema.safeParse(Object.fromEntries(entradas));
  return resultado.success
    ? { dados: resultado.data }
    : { negado: recusar(resultado.error) };
}
