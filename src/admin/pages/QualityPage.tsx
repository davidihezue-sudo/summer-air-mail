import { useMemo } from 'react'
import { useAdmin } from '../store'
import { Badge, Card, PageHead } from '../ui'
import { quality } from '../../content/derive'

const tone = (n: number) => (n >= 85 ? 'good' : n >= 60 ? 'info' : 'warn') as 'good' | 'info' | 'warn'

export function QualityPage() {
  const { content } = useAdmin()
  const q = useMemo(() => quality(content), [content])
  return (
    <>
      <PageHead title="Quality & Completeness" intro="A checklist of what recruiters expect, scored from your real content. The rules are yours: change them under Quality Rules." />
      <Card title="Overall">
        <p className="astat"><Badge tone={tone(q.overall)}>{q.overall} / 100</Badge> overall · profile completeness {q.completeness}%</p>
        {q.completenessIssues.length > 0 && <ul className="atodo">{q.completenessIssues.map((t) => <li key={t}>{t}</li>)}</ul>}
      </Card>
      <Card title="Projects">
        {q.items.length === 0 ? <p className="ahelp">No projects yet.</p> : (
          <ul className="arows">
            {q.items.map((i) => (
              <li key={i.id} className="arow-item arow-item--block">
                <a className="arow-item__main" href={`#/projects/${i.id}`}><span className="arow-item__text"><strong>{i.title}</strong>{i.issues.length > 0 && <span className="ahelp">{i.issues.join(' · ')}</span>}</span></a>
                <Badge tone={tone(i.score)}>{i.score}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
