import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { supabaseAdmin } from '@/utils/supabase'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { sendMail } from '@/utils/email'
import crypto from 'crypto'

const MINUTES = Number(process.env.ADMIN_SESSION_MAX_INACTIVE_MINUTES || '30')

async function bootstrapMaster() {
  const email = process.env.ADMIN_MASTER_EMAIL
  const password = process.env.ADMIN_MASTER_PASSWORD
  if (!email || !password) return
  const { data } = await supabaseAdmin.from('admin_users').select('id').eq('email', email).maybeSingle()
  if (!data) {
    const password_hash = await bcrypt.hash(password, 12)
    await supabaseAdmin.from('admin_users').insert({ email: email.toLowerCase(), password_hash, role: 'master', two_factor_enabled: false, is_active: true })
  }
}

bootstrapMaster().catch(() => {})

function getIp(req: Request) {
  return (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string
}

export const adminLoginLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many login attempts. Try again in 24 hours.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string }
    const ip = getIp(req)

    const { data: user, error } = await supabaseAdmin.from('admin_users').select('*').ilike('email', email).maybeSingle()
    if (error) throw error

    let success = false
    if (user && user.is_active && (await bcrypt.compare(password, user.password_hash))) {
      success = true
    }

    await supabaseAdmin.from('admin_login_attempts').insert({ email: email.toLowerCase(), ip, success })

    if (!success) {
      try { await sendMail({ to: process.env.ADMIN_MASTER_EMAIL || email, subject: 'Admin login failed', html: `<p>Failed admin login for ${email} from ${ip}</p>` }) } catch {}
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    if (user.two_factor_enabled) {
      // Issue a short-lived 2FA ticket
      const ticket = crypto.randomBytes(24).toString('hex')
      await supabaseAdmin.from('admin_sessions').insert({ user_id: user.id, ip, user_agent: req.headers['user-agent'] || '' })
      return res.status(200).json({ success: true, data: { status: '2fa_required', ticket, userId: user.id } })
    }

    // Create session
    const { data: sessionRow, error: sessErr } = await supabaseAdmin
      .from('admin_sessions')
      .insert({ user_id: user.id, ip, user_agent: req.headers['user-agent'] || '' })
      .select('id')
      .single()
    if (sessErr) throw sessErr

    res.cookie('admin_session', sessionRow.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: MINUTES * 60 * 1000,
    })
    try { await sendMail({ to: user.email, subject: 'Admin login', html: `<p>Admin login from ${ip}</p>` }) } catch {}
    res.status(200).json({ success: true })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const verify2fa = async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body as { userId: string; code: string }
    const ip = getIp(req)
    const { data: user, error } = await supabaseAdmin.from('admin_users').select('*').eq('id', userId).single()
    if (error) throw error
    if (!user.two_factor_enabled || !user.two_factor_secret) return res.status(400).json({ success: false, message: '2FA not enabled' })

    const ok = speakeasy.totp.verify({ secret: user.two_factor_secret, encoding: 'base32', token: code, window: 1 })
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid 2FA code' })

    const { data: sessionRow, error: sessErr } = await supabaseAdmin
      .from('admin_sessions')
      .insert({ user_id: user.id, ip, user_agent: req.headers['user-agent'] || '' })
      .select('id')
      .single()
    if (sessErr) throw sessErr

    res.cookie('admin_session', sessionRow.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: MINUTES * 60 * 1000,
    })
    res.status(200).json({ success: true })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const setup2faStart = async (req: Request, res: Response) => {
  try {
    const secret = speakeasy.generateSecret({ length: 20, name: 'CalistaLife Admin' })
    const qr = await QRCode.toDataURL(secret.otpauth_url || '')
    res.status(200).json({ success: true, data: { base32: secret.base32, otpauthUrl: secret.otpauth_url, qr } })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const setup2faVerify = async (req: Request, res: Response) => {
  try {
    const { secretBase32, code } = req.body as { secretBase32: string; code: string }
    const ok = speakeasy.totp.verify({ secret: secretBase32, encoding: 'base32', token: code, window: 1 })
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid 2FA code' })

    const sessionId = req.cookies?.admin_session as string | undefined
    if (!sessionId) return res.status(401).json({ success: false, message: 'Unauthorized' })
    const { data: sess, error: sErr } = await supabaseAdmin.from('admin_sessions').select('user_id').eq('id', sessionId).single()
    if (sErr) throw sErr

    await supabaseAdmin.from('admin_users').update({ two_factor_enabled: true, two_factor_secret: secretBase32 }).eq('id', sess.user_id)
    res.status(200).json({ success: true })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    const sid = req.cookies?.admin_session as string | undefined
    if (sid) { await supabaseAdmin.from('admin_sessions').delete().eq('id', sid) }
    res.cookie('admin_session', '', { expires: new Date(0), httpOnly: true })
    res.status(200).json({ success: true })
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const getSession = async (req: Request, res: Response) => {
  try {
    const sid = req.cookies?.admin_session as string | undefined
    if (!sid) return res.status(401).json({ success: false })
    const { data: sess } = await supabaseAdmin.from('admin_sessions').select('*').eq('id', sid).single()
    if (!sess) return res.status(401).json({ success: false })
    const { data: user } = await supabaseAdmin.from('admin_users').select('id,email,role').eq('id', sess.user_id).single()
    res.status(200).json({ success: true, data: { user } })
  } catch (e: any) {
    res.status(500).json({ success: false })
  }
}

export const lockdown = async (req: Request, res: Response) => {
  try {
    // Only master can lockdown
    const sid = req.cookies?.admin_session as string | undefined
    if (!sid) return res.status(401).json({ success: false })
    const { data: sess } = await supabaseAdmin.from('admin_sessions').select('*').eq('id', sid).single()
    if (!sess) return res.status(401).json({ success: false })
    const { data: user } = await supabaseAdmin.from('admin_users').select('id,email,role').eq('id', sess.user_id).single()
    if (!user || user.role !== 'master') return res.status(403).json({ success: false, message: 'Forbidden' })

    await supabaseAdmin.from('admin_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    res.cookie('admin_session', '', { expires: new Date(0), httpOnly: true })
    res.status(200).json({ success: true, message: 'All sessions terminated' })
  } catch (e: any) {
    res.status(500).json({ success: false })
  }
}
