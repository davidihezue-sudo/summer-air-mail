// Alerts and contact notifications. SMTP and webhook settings come only from environment variables.
import nodemailer from 'nodemailer'

export function createMailer(env = process.env, { transportFactory = nodemailer.createTransport.bind(nodemailer), fetchImpl = fetch } = {}) {
  const smtp = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? transportFactory({ host: env.SMTP_HOST, port: Number(env.SMTP_PORT ?? 587), secure: env.SMTP_SECURE === 'true', auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } })
    : null
  const from = env.SMTP_FROM || env.SMTP_USER || ''
  const webhook = /^https:\/\//.test(env.ALERT_WEBHOOK_URL ?? '') ? env.ALERT_WEBHOOK_URL : ''
  const oneLine = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').slice(0, 200)
  return {
    emailConfigured: !!smtp, webhookConfigured: !!webhook,
    /** Never throws: a failed alert must not fail the visitor's submission. Returns what was delivered. */
    async notify({ to, subject, text, replyTo }) {
      const out = { email: false, webhook: false }
      if (smtp && to) {
        try { await smtp.sendMail({ from, to, subject: oneLine(subject), text, ...(replyTo ? { replyTo } : {}) }); out.email = true } catch (e) { console.error('Email alert failed:', e.message) }
      }
      if (webhook) {
        try {
          const r = await fetchImpl(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: `${oneLine(subject)}\n${text}`, subject: oneLine(subject), message: text }) })
          out.webhook = r.ok
        } catch (e) { console.error('Webhook alert failed:', e.message) }
      }
      return out
    },
  }
}
