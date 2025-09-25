import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoIndex } from '../hooks/useNoIndex'

export default function AdminLogin({ base }: { base: string }) {
  useNoIndex('Store Management')
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const api = async (path: string, body: any) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${base}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.message || 'Request failed')
    return json
  }

  const onLogin = async () => {
    setError(null); setLoading(true)
    try {
      const res = await api('/auth/login', { email, password })
      if (res?.data?.status === '2fa_required') {
        setUserId(res.data.userId)
      } else {
        nav(`/${base}/dashboard`)
      }
    } catch (e: any) {
      setError(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async () => {
    setError(null); setLoading(true)
    try {
      if (!userId) throw new Error('Missing user')
      await api('/auth/verify-2fa', { userId, code })
      nav(`/${base}/dashboard`)
    } catch (e: any) {
      setError(e?.message || '2FA failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm border rounded-lg p-6">
        <h1 className="text-xl font-bold mb-4">Store Management</h1>
        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
        {!userId ? (
          <>
            <input className="w-full border rounded p-3 mb-3" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <input className="w-full border rounded p-3 mb-4" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <button disabled={loading} onClick={onLogin} className="w-full py-3 bg-black text-white rounded-lg disabled:opacity-50">{loading ? '...' : 'Secure Login'}</button>
          </>
        ) : (
          <>
            <input className="w-full border rounded p-3 mb-4" placeholder="2FA Code" value={code} onChange={(e)=>setCode(e.target.value)} />
            <button disabled={loading} onClick={onVerify} className="w-full py-3 bg-black text-white rounded-lg disabled:opacity-50">{loading ? '...' : 'Verify 2FA'}</button>
          </>
        )}
      </div>
    </div>
  )
}
