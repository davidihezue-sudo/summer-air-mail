// Minimal AWS Signature Version 4 for S3 compatible object storage (AWS, Cloudflare R2, Backblaze B2, MinIO).
// Hand written to avoid a large SDK. Verified against AWS's published example vectors in tests/server-extra.test.ts.
import { createHash, createHmac } from 'node:crypto'

const sha256 = (d) => createHash('sha256').update(d).digest('hex')
const hmac = (k, d) => createHmac('sha256', k).update(d).digest()
const uriEncode = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

/** Builds the canonical request string. Exposed for tests. */
export function canonicalRequest({ method, path, query = {}, headers, payloadHash }) {
  const names = Object.keys(headers).map((h) => h.toLowerCase()).sort()
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim().replace(/\s+/g, ' ')]))
  const q = Object.keys(query).sort().map((k) => `${uriEncode(k)}=${uriEncode(String(query[k]))}`).join('&')
  return [method, path.split('/').map(uriEncode).join('/'), q, names.map((n) => `${n}:${lower[n]}\n`).join(''), names.join(';'), payloadHash].join('\n')
}

export function sign({ method, path, query = {}, headers, payload = '', region, service = 's3', accessKey, secretKey, date, payloadHash }) {
  const amzDate = date // compact ISO 8601, for example 20130524T000000Z
  const day = amzDate.slice(0, 8)
  const ph = payloadHash ?? sha256(payload)
  const hdrs = { ...headers, 'x-amz-date': amzDate }
  const creq = canonicalRequest({ method, path, query, headers: hdrs, payloadHash: ph })
  const scope = `${day}/${region}/${service}/aws4_request`
  const sts = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(creq)].join('\n')
  const key = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, day), region), service), 'aws4_request')
  const signature = createHmac('sha256', key).update(sts).digest('hex')
  const signedHeaders = Object.keys(hdrs).map((h) => h.toLowerCase()).sort().join(';')
  return { signature, canonicalRequest: creq, canonicalHash: sha256(creq), stringToSign: sts, amzDate, authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}` }
}

/** PUT an object using path style addressing. Config comes from environment variables only. */
export async function putObject({ endpoint, region, bucket, accessKey, secretKey, key, body, contentType = 'application/zip', fetchImpl = fetch, now = new Date() }) {
  const url = new URL(endpoint)
  const path = `/${bucket}/${key}`
  const date = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const payloadHash = sha256(body)
  const s = sign({ method: 'PUT', path, headers: { host: url.host, 'x-amz-content-sha256': payloadHash, 'content-type': contentType }, region, accessKey, secretKey, date, payloadHash })
  const res = await fetchImpl(`${url.origin}${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'PUT', body,
    headers: { host: url.host, 'x-amz-date': s.amzDate, 'x-amz-content-sha256': payloadHash, 'content-type': contentType, authorization: s.authorization },
  })
  if (!res.ok) throw new Error(`Upload failed with status ${res.status}`)
  return true
}

export const s3FromEnv = (env) => (env.S3_ENDPOINT && env.S3_BUCKET && env.S3_ACCESS_KEY && env.S3_SECRET_KEY
  ? { endpoint: env.S3_ENDPOINT, region: env.S3_REGION || 'auto', bucket: env.S3_BUCKET, accessKey: env.S3_ACCESS_KEY, secretKey: env.S3_SECRET_KEY, prefix: env.S3_PREFIX ?? 'backups/' }
  : null)
