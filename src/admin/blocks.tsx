import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2 } from 'lucide-react'
import type { Block, BlockType } from '../content/types'
import { BLOCK_LABELS, newBlock } from '../content/factories'
import { Fields, IconBtn, type Field } from './fields'
import { getIn, moveItem } from './paths'
import { useAdmin } from './store'

const PLATFORM_OPTIONS = ['instagram', 'tiktok', 'facebook', 'linkedin', 'youtube', 'pinterest', 'x', 'threads', 'snapchat', 'web']
const CLASSES = [{ value: 'verified', label: 'Verified result' }, { value: 'team', label: 'Team result' }, { value: 'individual', label: 'Individual result' }, { value: 'confidential', label: 'Confidential result' }, { value: 'illustrative', label: 'Illustrative example' }]

const caption: Field = { kind: 'text', key: 'caption', label: 'Caption (optional)' }

/** One small form per block type. Add a type here and in content/factories.ts to extend the builder. */
export const BLOCK_FIELDS: Record<BlockType, Field[]> = {
  heading: [{ kind: 'text', key: 'text', label: 'Heading' }, { kind: 'select', key: 'level', label: 'Size', options: [{ value: '2', label: 'Large' }, { value: '3', label: 'Small' }] }],
  paragraph: [{ kind: 'rich', key: 'text', label: 'Text' }],
  image: [{ kind: 'image', video: true, key: 'image', label: 'Image or short video' }, caption],
  gallery: [{ kind: 'images', key: 'images', label: 'Images' }, caption],
  video: [{ kind: 'file', key: 'src', label: 'Video', accept: 'video', help: 'Upload an MP4 or WebM, or paste a YouTube or Vimeo link. It never autoplays.' }, { kind: 'file', key: 'poster', label: 'Cover image', accept: 'image' }, { kind: 'text', key: 'title', label: 'Title' }, caption],
  reel: [{ kind: 'file', key: 'src', label: 'Reel or short video', accept: 'video', help: 'Vertical 9:16 works best. Paste a YouTube Shorts link or upload an MP4.' }, { kind: 'file', key: 'poster', label: 'Cover image', accept: 'image' }, { kind: 'text', key: 'title', label: 'Title' }, caption],
  screenshot: [{ kind: 'image', key: 'image', label: 'Screenshot', help: 'Use Hide parts in the Media library to blur client names or numbers first.' }, caption],
  link: [{ kind: 'url', key: 'url', label: 'Link' }, { kind: 'text', key: 'label', label: 'Title' }, { kind: 'text', key: 'description', label: 'Short description' }],
  button: [{ kind: 'url', key: 'url', label: 'Link' }, { kind: 'text', key: 'label', label: 'Button text' }],
  quote: [{ kind: 'textarea', key: 'text', label: 'Quote' }, { kind: 'text', key: 'attribution', label: 'Who said it' }],
  metric: [
    { kind: 'text', key: 'label', label: 'What was measured' }, { kind: 'number', key: 'value', label: 'Value' },
    { kind: 'text', key: 'prefix', label: 'Prefix (for example £)' }, { kind: 'text', key: 'unit', label: 'Unit (for example %)' },
    { kind: 'text', key: 'period', label: 'Measurement period' }, { kind: 'text', key: 'note', label: 'Note' },
    { kind: 'select', key: 'classification', label: 'Result type', options: CLASSES },
  ],
  chart: [
    { kind: 'select', key: 'chart', label: 'Chart type', options: [{ value: 'bar', label: 'Bars' }, { value: 'line', label: 'Line' }] },
    { kind: 'text', key: 'title', label: 'Title' }, { kind: 'text', key: 'prefix', label: 'Prefix' }, { kind: 'text', key: 'unit', label: 'Unit' },
    { kind: 'list', key: 'points', label: 'Data points', item: (p) => `${p.label} ${p.value ?? ''}`, make: () => ({ label: '', value: 0 }), addLabel: 'Add data point', fields: [{ kind: 'text', key: 'label', label: 'Label' }, { kind: 'number', key: 'value', label: 'Value', nullable: false }] },
    { kind: 'text', key: 'period', label: 'Measurement period' }, { kind: 'text', key: 'note', label: 'Note' },
  ],
  beforeAfter: [
    { kind: 'select', key: 'variant', label: 'Style', options: [{ value: 'before-after', label: 'Before and after' }, { value: 'problem-solution', label: 'Problem and solution' }, { value: 'old-new', label: 'Old and new' }, { value: 'baseline-result', label: 'Baseline and result' }] },
    { kind: 'image', key: 'before', label: 'First image (before, problem, old, baseline)' }, { kind: 'image', key: 'after', label: 'Second image (after, solution, new, result)' }, caption,
  ],
  embed: [{ kind: 'url', key: 'url', label: 'Link', help: 'YouTube and Vimeo play in the page after a click. Instagram, TikTok and other links show as a link card.' }, { kind: 'text', key: 'title', label: 'Title' }, caption],
  pdf: [{ kind: 'file', key: 'url', label: 'PDF', accept: 'pdf' }, { kind: 'text', key: 'title', label: 'Title' }, { kind: 'text', key: 'description', label: 'Description' }],
  download: [{ kind: 'file', key: 'url', label: 'File', accept: 'any' }, { kind: 'text', key: 'title', label: 'Title' }, { kind: 'text', key: 'filename', label: 'Download file name' }, { kind: 'text', key: 'description', label: 'Description' }],
  timeline: [{ kind: 'list', key: 'entries', label: 'Entries', item: (e) => e.label, make: () => ({ label: '', text: '' }), addLabel: 'Add entry', fields: [{ kind: 'text', key: 'label', label: 'When or what' }, { kind: 'textarea', key: 'text', label: 'Details' }] }],
  process: [{ kind: 'list', key: 'entries', label: 'Steps', item: (e) => e.label, make: () => ({ label: '', text: '' }), addLabel: 'Add step', fields: [{ kind: 'text', key: 'label', label: 'Step' }, { kind: 'textarea', key: 'text', label: 'Details' }] }],
  framework: [{ kind: 'text', key: 'title', label: 'Title' }, { kind: 'list', key: 'columns', label: 'Columns', item: (c) => c.title, make: () => ({ title: '', items: [] }), addLabel: 'Add column', fields: [{ kind: 'text', key: 'title', label: 'Column title' }, { kind: 'strings', key: 'items', label: 'Points' }] }],
  skills: [{ kind: 'text', key: 'title', label: 'Title' }, { kind: 'strings', key: 'items', label: 'Skills' }],
  platforms: [{ kind: 'text', key: 'title', label: 'Title' }, { kind: 'multi', key: 'items', label: 'Platforms', options: PLATFORM_OPTIONS, custom: true }],
  flow: [
    { kind: 'text', key: 'title', label: 'Title (for example Lead lifecycle)' }, { kind: 'text', key: 'caption', label: 'One line about it (optional)' },
    { kind: 'list', key: 'nodes', label: 'Steps, in order', item: (n) => `${n.label || 'Untitled step'}${n.kind === 'decision' ? ' (decision)' : ''}`, addLabel: 'Add step', make: () => ({ label: '', kind: 'step', detail: '', branches: [] }), fields: [
      { kind: 'text', key: 'label', label: 'Step name' },
      { kind: 'select', key: 'kind', label: 'What it is', options: [{ value: 'start', label: 'Start (a trigger or entry point)' }, { value: 'step', label: 'Step (an action)' }, { value: 'decision', label: 'Decision (a question with outcomes)' }, { value: 'system', label: 'System (a tool, table or automation)' }, { value: 'end', label: 'End (a result)' }] },
      { kind: 'textarea', key: 'detail', label: 'What happens here (shown when a visitor opens the step)' },
      { kind: 'list', key: 'branches', label: 'Outcomes of this decision', showIf: (n: { kind?: string }) => n.kind === 'decision', addLabel: 'Add outcome', item: (b) => `${b.condition || 'If...'} then ${b.outcome || '...'}`, make: () => ({ condition: '', outcome: '' }), fields: [{ kind: 'text', key: 'condition', label: 'If (for example score is 50 or more)' }, { kind: 'text', key: 'outcome', label: 'Then (for example assign to sales)' }] },
    ] },
  ],
  query: [
    { kind: 'text', key: 'title', label: 'Title (what this query is)' },
    { kind: 'select', key: 'language', label: 'Language', options: [{ value: 'sql', label: 'SQL' }, { value: 'python', label: 'Python' }, { value: 'dax', label: 'DAX' }, { value: 'r', label: 'R' }, { value: 'other', label: 'Other' }] },
    { kind: 'textarea', key: 'code', label: 'The query or code', rows: 12, help: 'Remove client names, keys and anything confidential first. Shown exactly as written.' },
    { kind: 'textarea', key: 'text', label: 'What it answers, in plain English' },
  ],
  dashboard: [
    { kind: 'url', key: 'url', label: 'Dashboard link', help: 'Looker Studio (use its share or embed link), Tableau Public, or Power BI publish-to-web. Other sites show as a link card. Only publish dashboards that are safe for anyone to see.' },
    { kind: 'text', key: 'title', label: 'Title' }, { kind: 'text', key: 'caption', label: 'Caption (optional)' },
    { kind: 'number', key: 'height', label: 'Height in pixels', min: 300, max: 1400, nullable: false },
  ],
  metricTree: [
    { kind: 'text', key: 'title', label: 'The goal (for example Grow qualified leads)' }, { kind: 'text', key: 'note', label: 'Its target or period (optional, written by you)' },
    { kind: 'list', key: 'tree', label: 'Measures under the goal', addLabel: 'Add a measure', item: (b) => b.label || 'Untitled measure', make: () => ({ label: '', value: '', note: '', children: [] }), fields: [
      { kind: 'text', key: 'label', label: 'Measure (for example Conversion rate)' }, { kind: 'text', key: 'value', label: 'Value, if you have a verified one (optional)' }, { kind: 'text', key: 'note', label: 'Note (optional)' },
      { kind: 'list', key: 'children', label: 'Levers behind it', addLabel: 'Add a lever', item: (c) => c.label || 'Untitled lever', make: () => ({ label: '', value: '', note: '' }), fields: [{ kind: 'text', key: 'label', label: 'Lever (for example Landing page speed)' }, { kind: 'text', key: 'value', label: 'Value (optional)' }, { kind: 'text', key: 'note', label: 'Note (optional)' }] },
    ] },
  ],
}

const summary = (b: Block) => b.text || b.title || b.label || b.caption || b.url || b.src || (b.images?.length ? `${b.images.length} images` : '') || ''

export function BlockListEditor({ path }: { path: string }) {
  const { content, set } = useAdmin()
  const blocks = (getIn(content, path) as Block[] | undefined) ?? []
  const [open, setOpen] = useState<string | null>(null)
  const [type, setType] = useState<BlockType>('paragraph')

  return (
    <div className="ablocks">
      <ol className="alist">
        {blocks.map((b, i) => (
          <li key={b.id} className="alist__item">
            <div className="alist__head">
              <button type="button" className="alist__title" aria-expanded={open === b.id} onClick={() => setOpen(open === b.id ? null : b.id)}>
                <ChevronDown size={16} aria-hidden className={open === b.id ? 'is-open' : ''} />
                <strong>{BLOCK_LABELS[b.type]}</strong> <span className="ahelp">{summary(b).slice(0, 60)}</span>
              </button>
              <IconBtn label="Move up" disabled={i === 0} onClick={() => set(path, moveItem(blocks, i, i - 1))}><ArrowUp size={16} /></IconBtn>
              <IconBtn label="Move down" disabled={i === blocks.length - 1} onClick={() => set(path, moveItem(blocks, i, i + 1))}><ArrowDown size={16} /></IconBtn>
              <IconBtn label="Duplicate" onClick={() => set(path, [...blocks.slice(0, i + 1), { ...structuredClone(b), id: `${b.id}-copy${Date.now().toString(36).slice(-3)}` }, ...blocks.slice(i + 1)])}><Copy size={16} /></IconBtn>
              <IconBtn label="Delete" danger onClick={() => set(path, blocks.filter((_, j) => j !== i))}><Trash2 size={16} /></IconBtn>
            </div>
            {open === b.id && <div className="alist__body"><Fields fields={BLOCK_FIELDS[b.type]} base={`${path}.${i}`} /></div>}
          </li>
        ))}
      </ol>
      <div className="arow ablocks__add">
        <label className="sr-only" htmlFor="block-type">Block type</label>
        <select id="block-type" value={type} onChange={(e) => setType(e.target.value as BlockType)}>
          {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => <option key={t} value={t}>{BLOCK_LABELS[t]}</option>)}
        </select>
        <button type="button" className="abtn abtn--primary" onClick={() => { const nb = newBlock(type); set(path, [...blocks, nb]); setOpen(nb.id) }}><Plus size={14} aria-hidden /> Add block</button>
      </div>
    </div>
  )
}
