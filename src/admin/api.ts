import type { MediaAsset, SiteContent } from '../content/types'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData
  let res: Response
  try {
    res = await fetch(`/api/admin${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: { 'x-requested-with': 'sam-admin', ...(isForm ? {} : { 'content-type': 'application/json' }), ...(init.headers ?? {}) },
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is it running?')
  }
  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('application/json')) {
    throw new ApiError(res.status, res.status === 404 ? 'The admin server is not running here. Start it with npm run dev:all or npm start.' : `Unexpected response (${res.status}).`)
  }
  const data = await res.json()
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status}).`)
  return data as T
}

export interface Status {
  hasDraft: boolean
  draftRev: number
  draftUpdatedAt: string | null
  publishedAt: string | null
  publishedRev: number
  unpublished: boolean
}

export const api = {
  session: () => request<{ configured: boolean; authenticated: boolean }>('/session'),
  login: (username: string, password: string) => request<{ ok: true }>('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<{ ok: true }>('/logout', { method: 'POST', body: '{}' }),
  getDraft: () => request<{ draft: SiteContent | null; rev: number } & Status>('/draft'),
  saveDraft: (content: SiteContent, baseRev: number) =>
    request<{ rev: number } & Status>('/draft', { method: 'PUT', body: JSON.stringify({ content, baseRev }) }),
  publish: () => request<{ publishedAt: string } & Status>('/publish', { method: 'POST', body: '{}' }),
  discard: () => request<{ draft: SiteContent | null; rev: number } & Status>('/discard', { method: 'POST', body: '{}' }),
  history: () => request<{ history: { id: string; publishedAt: string; rev: number }[] }>('/history'),
  restore: (id: string) => request<{ draft: SiteContent; rev: number } & Status>('/restore', { method: 'POST', body: JSON.stringify({ id }) }),
  importContent: (content: unknown) => request<{ draft: SiteContent; rev: number } & Status>('/import', { method: 'POST', body: JSON.stringify({ content }) }),
  changePassword: (current: string, next: string) => request<{ ok: true }>('/password', { method: 'POST', body: JSON.stringify({ current, next }) }),
  media: () => request<{ media: MediaAsset[] }>('/media'),
  upload: (file: Blob, name: string, alt = '') => {
    const f = new FormData()
    f.append('file', file, name)
    if (alt) f.append('alt', alt)
    return request<{ asset: MediaAsset }>('/media', { method: 'POST', body: f })
  },
  updateMedia: (id: string, patch: Partial<Pick<MediaAsset, 'alt' | 'caption' | 'tags' | 'projectIds'>>) =>
    request<{ asset: MediaAsset }>(`/media/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteMedia: (id: string) => request<{ ok: true }>(`/media/${id}`, { method: 'DELETE' }),
}
