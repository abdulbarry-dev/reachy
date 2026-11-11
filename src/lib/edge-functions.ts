import { supabase } from './supabase'

export function getEdgeFunctionUrl(name: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '') ?? ''
  return `${base}/functions/v1/${name}`
}

/**
 * Posts to an Edge Function as the signed-in user and returns its JSON body.
 *
 * Every call site needs the same four steps — read the session, send the
 * bearer token, turn a non-2xx response into an `Error` carrying the function's
 * own `error` message, and decode the body. They were copied into three pages,
 * which meant three slightly different copy of the error handling.
 *
 * @param name   Function slug, e.g. `create-campaign`.
 * @param payload JSON request body.
 * @param fallbackError Message used when the response carries no usable
 *   `error` string — a proxy error page, a network-level 502, a bad body.
 */
export async function invokeEdgeFunction<T = void>(
  name: string,
  payload: unknown,
  fallbackError: string,
): Promise<T> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) throw new Error(sessionError.message)
  if (!session) throw new Error('Not authenticated')

  const response = await fetch(getEdgeFunctionUrl(name), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackError))
  }

  const body = await response.text()
  if (!body) return undefined as T

  try {
    return JSON.parse(body) as T
  } catch {
    // A 2xx with a non-JSON body breaks the contract the caller relies on.
    throw new Error(fallbackError)
  }
}

/** The function's own error message, or the caller's fallback, never a parse crash. */
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body !== null && typeof body === 'object' && 'error' in body) {
      const message = (body as { error: unknown }).error
      if (typeof message === 'string' && message) return message
    }
  } catch {
    // Non-JSON error body (HTML from a proxy, empty body): use the fallback.
  }

  return fallback
}
