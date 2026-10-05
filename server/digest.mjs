// The Monday summary: what happened on the site this week, and what needs your attention.

/** Year, month, day, weekday (0 = Sunday) and hour as they are in a time zone right now. */
export function localParts(now, timeZone = 'UTC') {
  const f = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', hourCycle: 'h23', weekday: 'short' })
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), hour: Number(p.hour) }
}

/** The Monday (or whichever day) that starts the week the date is in. Used to send once per week. */
export function weekStart(date, startDay) {
  const d = new Date(`${date}T12:00:00Z`)
  const back = (d.getUTCDay() - startDay + 7) % 7
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}

/** True when the summary should go out now: switched on, it is the chosen day and hour or later, and this week's has not been sent. */
export function digestDue(digest, now = new Date()) {
  if (!digest?.enabled) return false
  const t = localParts(now, digest.timezone || 'UTC')
  if (t.weekday !== digest.day || t.hour < digest.hour) return false
  return !digest.lastSent || weekStart(digest.lastSent, digest.day) !== weekStart(t.date, digest.day)
}

const pct = (now, before) => (before > 0 ? `${now >= before ? '+' : ''}${Math.round(((now - before) / before) * 100)}% on the week before` : before === 0 && now > 0 ? 'nothing the week before' : 'no change')

/** Plain text, so it reads the same in any mail app or chat. Only real counts, never estimates. */
export function buildDigest({ insights, enquiries, content, now = new Date() }) {
  const week = insights.summary(7, now)
  const two = insights.summary(14, now)
  const before = { views: two.views - week.views, visitors: two.visitors - week.visitors }
  const portfolio = content?.portfolio ?? {}
  const name = portfolio.profile?.preferredName || portfolio.profile?.fullName || 'your portfolio'
  const top = (obj, n = 3) => Object.entries(obj ?? {}).sort((a, b) => b[1] - a[1]).slice(0, n)
  const pages = top(Object.fromEntries(Object.entries(week.paths).filter(([p]) => !/^\/(for|admin|go)(\/|$)/.test(p))))
  const titleOf = (path) => {
    const w = /^\/work\/([^/]+)$/.exec(path)
    if (w) return (content?.projects ?? []).find((p) => p.id === decodeURIComponent(w[1]))?.title ?? path
    const n = /^\/notes\/([^/]+)$/.exec(path)
    if (n) return (content?.notes ?? []).find((x) => x.slug === decodeURIComponent(n[1]))?.title ?? path
    return path === '/' ? 'Home page' : path
  }
  const apps = (content?.applications ?? []).map((a) => ({ a, views: week.paths[`/for/${a.slug}`] ?? 0 })).filter((x) => x.views > 0).sort((x, y) => y.views - x.views)
  const all = enquiries.list()
  const since = new Date(now.getTime() - 7 * 864e5).toISOString()
  const fresh = all.filter((x) => x.at >= since)
  const unread = all.filter((x) => !x.read).length
  const due = enquiries.due(now.toISOString().slice(0, 10))
  const lines = [
    `${name}: your week on the site`,
    '',
    `Outside visitors: ${week.visitors} (${pct(week.visitors, before.visitors)})`,
    `Page views: ${week.views} (${pct(week.views, before.views)})`,
    `Your own visits: ${week.own.views}`,
  ]
  if (pages.length) lines.push('', 'Most read:', ...pages.map(([p, v]) => `  ${v}  ${titleOf(p)}`))
  const opened = top(week.items?.project)
  if (opened.length) lines.push('', 'Projects opened:', ...opened.map(([p, v]) => `  ${v}  ${p}`))
  lines.push('', apps.length ? 'Application links opened:' : 'Application links opened: none this week')
  for (const x of apps) lines.push(`  ${x.views}  ${x.a.company || x.a.label || x.a.slug}`)
  lines.push('', `Messages this week: ${fresh.length} new, ${unread} unread in total`)
  if (due.length) lines.push('', `Follow-ups due (${due.length}):`, ...due.slice(0, 10).map((x) => `  ${x.name}${x.company ? `, ${x.company}` : ''}: ${x.followUp}`))
  else lines.push('Follow-ups due: none')
  return { subject: `Your portfolio this week: ${week.visitors} visitor${week.visitors === 1 ? '' : 's'}${due.length ? `, ${due.length} follow-up${due.length === 1 ? '' : 's'} due` : ''}`, text: lines.join('\n') + '\n' }
}
