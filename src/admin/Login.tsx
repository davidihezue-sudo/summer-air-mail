import { useState, type FormEvent } from 'react'
import { api, ApiError } from './api'

export function Login({ configured, onDone, serverError }: { configured: boolean; onDone: () => void; serverError: string }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(serverError)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.login(username.trim(), password)
      onDone()
    } catch (err) {
      setError((err as ApiError).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="alogin">
      <form className="alogin__card" onSubmit={submit}>
        <p className="alogin__eyebrow">Portfolio admin</p>
        <h1>Sign in</h1>
        {!configured && !serverError && (
          <div className="anotice" role="note">
            <strong>No admin account exists yet.</strong>
            <p>On the machine that runs this site, open a terminal in the project folder and run:</p>
            <pre>npm run admin:setup</pre>
            <p>Then come back and sign in.</p>
          </div>
        )}
        <label className="afield"><span>Username</span><input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required autoFocus /></label>
        <label className="afield"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {error && <p role="alert" className="aerror">{error}</p>}
        <button className="abtn abtn--primary abtn--wide" disabled={busy || !username || !password}>{busy ? 'Signing in' : 'Sign in'}</button>
        <p className="ahelp"><a href="/">Back to the website</a></p>
      </form>
    </main>
  )
}
