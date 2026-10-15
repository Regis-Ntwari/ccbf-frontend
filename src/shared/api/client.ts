import type { ZodType } from 'zod'
import { useAuthStore } from '@/shared/stores/auth'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
  get isNetwork() {
    return this.status === 0
  }
}

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
export const USE_MOCK = import.meta.env.VITE_API_MOCK !== 'false'

interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  schema: ZodType<T>
  signal?: AbortSignal
}

/**
 * Single entry point for all HTTP. Every response is validated with Zod so the
 * UI never renders a shape the frontend did not expect (and typing stays honest).
 */
export async function api<T>({ method = 'GET', path, body, schema, signal }: RequestOptions<T>): Promise<T> {
  const token = useAuthStore.getState().session?.token
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  let status: number
  let payload: unknown
  if (USE_MOCK) {
    const { mockFetch } = await import('@/mocks/handlers')
    const res = await mockFetch(method, path, body, headers)
    status = res.status
    payload = res.body
  } else {
    let res: Response
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
        credentials: 'include',
      })
    } catch (e) {
      throw new ApiError(0, 'network', navigator.onLine ? 'Could not reach the server' : 'You are offline', e)
    }
    status = res.status
    payload = res.status === 204 ? null : await res.json().catch(() => null)
  }

  if (status === 401) useAuthStore.getState().clear()
  if (status >= 400) {
    const err = (payload ?? {}) as { code?: string; message?: string; details?: unknown }
    throw new ApiError(status, err.code ?? 'error', err.message ?? `Request failed (${status})`, err.details)
  }
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    if (import.meta.env.DEV) console.error('Response validation failed', path, parsed.error.issues)
    throw new ApiError(500, 'invalid_response', 'The server returned unexpected data', parsed.error.issues)
  }
  return parsed.data
}
