export type Token = { type: 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'text'; text: string }

const SQL = 'select from where group by order having join left right inner outer full cross on as and or not in is null like between case when then else end union all distinct limit offset with over partition insert into values update set delete create table view index drop alter count sum avg min max coalesce cast asc desc exists true false'.split(' ')
const PYTHON = 'import from as def return if elif else for while in not and or is none true false True False None class try except finally with lambda yield pass break continue raise assert global print'.split(' ')
const DAX = 'define measure var return evaluate summarize calculate filter all values if switch true false and or not in related sumx averagex countrows divide blank datesytd totalytd'.split(' ')
const R = 'function if else for while in return library true false TRUE FALSE NULL NA'.split(' ')

const WORDS: Record<string, Set<string>> = { sql: new Set(SQL), python: new Set(PYTHON), dax: new Set(DAX), r: new Set(R) }
const COMMENT: Record<string, string> = {
  sql: '--[^\\n]*|/\\*[\\s\\S]*?\\*/',
  python: '#[^\\n]*',
  r: '#[^\\n]*',
  dax: '//[^\\n]*|--[^\\n]*|/\\*[\\s\\S]*?\\*/',
}

/** A small, dependency-free colouring of code for display. It never changes the text: joining the tokens gives back the input. */
export function highlight(code: string, language = 'other'): Token[] {
  const lang = language.toLowerCase()
  const words = WORDS[lang]
  const comment = COMMENT[lang]
  const re = new RegExp(`(${comment ?? '(?!)'})|('(?:[^'\\\\\\n]|\\\\.|'')*'|"(?:[^"\\\\\\n]|\\\\.)*")|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_][A-Za-z0-9_]*)`, 'g')
  const out: Token[] = []
  let last = 0
  const push = (type: Token['type'], text: string) => { if (text) out.push({ type, text }) }
  for (const m of code.matchAll(re)) {
    push('text', code.slice(last, m.index))
    last = (m.index ?? 0) + m[0].length
    if (m[1] !== undefined) push('comment', m[0])
    else if (m[2] !== undefined) push('string', m[0])
    else if (m[3] !== undefined) push('number', m[0])
    else if (words?.has(m[0].toLowerCase()) && (lang === 'sql' || lang === 'dax' ? true : words.has(m[0]))) push('keyword', m[0])
    else if (code[last] === '(') push('function', m[0])
    else push('text', m[0])
  }
  push('text', code.slice(last))
  return out
}
