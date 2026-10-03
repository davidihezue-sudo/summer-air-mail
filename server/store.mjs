import { mkdir, readFile, rename, writeFile, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

const MAX_HISTORY = 20

/**
 * Single file JSON store with atomic writes. Holds the draft, the published copy and the last
 * published versions for rollback. Suitable for one server instance with a persistent disk.
 * For several instances or heavy editing, replace this module with a database (see README).
 */
export function createStore(dir) {
  const file = join(dir, 'content.json')
  let state = { version: 1, draft: null, published: null, history: [] }
  let queue = Promise.resolve()

  async function init() {
    await mkdir(dir, { recursive: true })
    if (existsSync(file)) {
      try {
        const parsed = JSON.parse(await readFile(file, 'utf8'))
        state = { version: 1, draft: null, published: null, history: [], ...parsed }
      } catch (e) {
        // Never silently overwrite a file we cannot read.
        throw new Error(`content.json is unreadable (${e.message}). Restore data/content.json.bak or fix the file.`, { cause: e })
      }
    }
  }

  function persist() {
    queue = queue.then(async () => {
      const tmp = `${file}.${randomBytes(4).toString('hex')}.tmp`
      await writeFile(tmp, JSON.stringify(state), { mode: 0o600 })
      if (existsSync(file)) await copyFile(file, `${file}.bak`).catch(() => {})
      await rename(tmp, file)
    })
    return queue
  }

  return {
    init,
    getPublished: () => state.published,
    getDraft: () => state.draft,
    status: () => ({
      hasDraft: !!state.draft,
      draftRev: state.draft?.rev ?? 0,
      draftUpdatedAt: state.draft?.updatedAt ?? null,
      publishedAt: state.published?.publishedAt ?? null,
      publishedRev: state.published?.rev ?? 0,
      unpublished: !!state.draft && (!state.published || state.draft.rev !== state.published.rev),
    }),
    /** Returns false on a revision conflict (another tab saved first). */
    async saveDraft(content, baseRev) {
      const current = state.draft?.rev ?? 0
      if (baseRev !== undefined && baseRev !== current) return { conflict: true, rev: current }
      state.draft = { rev: current + 1, updatedAt: new Date().toISOString(), content }
      await persist()
      return { conflict: false, rev: state.draft.rev }
    },
    async publish() {
      if (!state.draft) return null
      if (state.published) {
        state.history.unshift({ id: randomBytes(5).toString('hex'), publishedAt: state.published.publishedAt, rev: state.published.rev, content: state.published.content })
        state.history = state.history.slice(0, MAX_HISTORY)
      }
      state.published = { rev: state.draft.rev, publishedAt: new Date().toISOString(), content: state.draft.content }
      await persist()
      return state.published
    },
    async discardDraft() {
      if (!state.published) {
        state.draft = null
      } else {
        state.draft = { rev: (state.draft?.rev ?? 0) + 1, updatedAt: new Date().toISOString(), content: state.published.content }
      }
      await persist()
      return state.draft
    },
    history: () => state.history.map(({ id, publishedAt, rev }) => ({ id, publishedAt, rev })),
    async restore(id) {
      const h = state.history.find((x) => x.id === id)
      if (!h) return null
      state.draft = { rev: (state.draft?.rev ?? 0) + 1, updatedAt: new Date().toISOString(), content: h.content }
      await persist()
      return state.draft
    },
    /** Replace the draft with imported content. */
    async importDraft(content) {
      state.draft = { rev: (state.draft?.rev ?? 0) + 1, updatedAt: new Date().toISOString(), content }
      await persist()
      return state.draft
    },
    allContentStrings: () => JSON.stringify([state.draft?.content, state.published?.content, ...state.history.map((h) => h.content)]),
    flush: () => queue,
  }
}
