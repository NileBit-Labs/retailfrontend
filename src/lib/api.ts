const BASE_URL = import.meta.env.VITE_API_URL as string | undefined

if (!BASE_URL) {
  throw new Error(
    'VITE_API_URL is not set. Copy .env.example to .env (see CONTRIBUTING.md) and restart the dev server.',
  )
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Request failed with status ${status}`
    super(message)
    this.status = status
    this.body = body
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  shopId?: number | string
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  const token = localStorage.getItem('auth_token')
  if (token) headers.Authorization = `Bearer ${token}`

  const shopId =
    options.shopId ??
    (JSON.parse(localStorage.getItem('current_shop') ?? 'null')?.id as number | undefined)
  if (shopId) headers['X-Shop-Id'] = String(shopId)

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(response.status, data)
  }

  return data as T
}

// Laravel validation failures carry a generic top-level message ("... and 2
// more errors"); the first field error is the one worth showing a cashier.
export function apiErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const errors = (e.body as { errors?: Record<string, string[]> } | null)?.errors
    const first = errors ? Object.values(errors)[0]?.[0] : undefined
    return first ?? e.message
  }
  return 'Something went wrong. Please try again.'
}
