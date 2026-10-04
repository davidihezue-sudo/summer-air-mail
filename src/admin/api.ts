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

export interface Me { username: string; role: 'owner' | 'editor' | 'viewer' | ''; canPublish: boolean; storage: 'file' | 'postgres' }
export interface Enquiry { id: string; at: string; read: boolean; name: string; email: string; type: string; budget: string; company: string; message: string }
export interface Subscriber { id: string; at: string; email: string; consent: string }
export interface InsightsSummary { views: number; visitors: number; series: { day: string; views: number; visitors: number }[]; paths: Record<string, number>; refs: Record<string, number>; events: Record<string, number>; items: Record<string, Record<string, number>> }
export interface ServerSettings { notifyEmail: string; notifyOnEnquiry: boolean; notifyOnSubscriber: boolean; enquiryRetentionDays: number; editorsCanPublish: boolean; backups: { enabled: boolean; everyHours: number; keep: number; s3: boolean } }
export interface EnvInfo { dataDir?: string; emailConfigured: boolean; webhookConfigured: boolean; s3Configured: boolean; storage: string }
export interface UserRow { username: string; role: 'owner' | 'editor' | 'viewer'; managedByEnv: boolean }
export interface BackupStatus { at: string | null; ok: boolean | null; file: string; uploaded: boolean; error: string; s3Configured: boolean }

export const api = {
  session: () => request<Me & { configured: boolean; authenticated: boolean }>('/session'),
  login: (username: string, password: string) => request<{ ok: true; role: string }>('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
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
  /** Uploads a file with progress. Videos come back as a job that is shrunk in the background; this waits for it. */
  upload: (file: Blob, name: string, alt = '', onStatus: (text: string) => void = () => {}) =>
    new Promise<{ asset: MediaAsset; note?: string }>((resolve, reject) => {
      const f = new FormData()
      f.append('file', file, name)
      if (alt) f.append('alt', alt)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/admin/media')
      xhr.setRequestHeader('x-requested-with', 'sam-admin')
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onStatus(`Uploading ${name}: ${Math.round((e.loaded / e.total) * 100)}%`) }
      xhr.onerror = () => reject(new ApiError(0, 'Cannot reach the server. Is it running?'))
      xhr.onload = async () => {
        let data: { asset?: MediaAsset; job?: { id: string }; error?: string } = {}
        try { data = JSON.parse(xhr.responseText) } catch { /* not JSON */ }
        if (xhr.status === 200 && data.asset) return resolve({ asset: data.asset })
        if (xhr.status !== 202 || !data.job) return reject(new ApiError(xhr.status, data.error ?? `Upload failed (${xhr.status}).`))
        try {
          for (;;) {
            const { job } = await request<{ job: { status: string; progress: number; asset: MediaAsset | null; error: string; note: string } }>(`/media/jobs/${data.job.id}`)
            if (job.status === 'done' && job.asset) return resolve({ asset: job.asset, note: job.note })
            if (job.status === 'error') return reject(new ApiError(422, job.error || 'Could not process that video.'))
            onStatus(`Shrinking ${name} for the web: ${Math.round(job.progress * 100)}%`)
            await new Promise((ok) => setTimeout(ok, 1200))
          }
        } catch (e) { reject(e) }
      }
      xhr.send(f)
    }),
  updateMedia: (id: string, patch: Partial<Pick<MediaAsset, 'alt' | 'caption' | 'tags' | 'projectIds'>>) =>
    request<{ asset: MediaAsset }>(`/media/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteMedia: (id: string) => request<{ ok: true }>(`/media/${id}`, { method: 'DELETE' }),
  enquiries: () => request<{ items: Enquiry[]; unread: number }>('/enquiries'),
  markEnquiry: (id: string, read: boolean) => request<{ ok: true; unread: number }>(`/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify({ read }) }),
  deleteEnquiry: (id: string) => request<{ ok: true }>(`/enquiries/${id}`, { method: 'DELETE' }),
  subscribers: () => request<{ items: Subscriber[] }>('/subscribers'),
  deleteSubscriber: (id: string) => request<{ ok: true }>(`/subscribers/${id}`, { method: 'DELETE' }),
  insights: (range: number) => request<InsightsSummary>(`/insights?range=${range}`),
  itemVersions: (collection: string, id: string) => request<{ versions: { index: number; at: string; title: string }[] }>(`/history/item/${collection}/${id}`),
  restoreItem: (collection: string, id: string, index: number) => request<{ draft: SiteContent; rev: number } & Status>(`/history/item/${collection}/${id}/restore`, { method: 'POST', body: JSON.stringify({ index }) }),
  settings: () => request<{ settings: ServerSettings; env: EnvInfo }>('/settings'),
  saveSettings: (settings: Partial<ServerSettings>) => request<{ settings: ServerSettings; env: EnvInfo }>('/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),
  testAlert: () => request<{ email: boolean; webhook: boolean }>('/settings/test-alert', { method: 'POST', body: '{}' }),
  users: () => request<{ users: UserRow[] }>('/users'),
  addUser: (username: string, password: string, role: string) => request<{ users: UserRow[] }>('/users', { method: 'POST', body: JSON.stringify({ username, password, role }) }),
  updateUser: (username: string, patch: { role?: string; password?: string }) => request<{ users: UserRow[] }>(`/users/${encodeURIComponent(username)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  removeUser: (username: string) => request<{ users: UserRow[] }>(`/users/${encodeURIComponent(username)}`, { method: 'DELETE' }),
  backups: () => request<{ backups: { name: string; size: number }[]; status: BackupStatus }>('/backups'),
  restoreBackup: async (file: File) => {
    const res = await fetch('/api/admin/backups/restore', { method: 'POST', credentials: 'same-origin', headers: { 'x-requested-with': 'sam-admin', 'content-type': 'application/zip' }, body: file })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new ApiError(res.status, data.error ?? `Restore failed (${res.status}).`)
    return data as { ok: true; records: number; uploads: number }
  },
  runBackup: () => request<{ result: BackupStatus; backups: { name: string; size: number }[] }>('/backups/run', { method: 'POST', body: '{}' }),
}
