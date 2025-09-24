import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '@/utils/supabase'

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sid = req.cookies?.admin_session as string | undefined
    if (!sid) return res.status(404).json({ success: false, message: 'Not found' })

    // IP whitelist check
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string
    const list = (process.env.ADMIN_IP_WHITELIST || '').split(',').map(s => s.trim()).filter(Boolean)
    if (list.length > 0 && !list.includes(ip) && !list.includes('*')) {
      return res.status(404).json({ success: false, message: 'Not found' })
    }

    const { data: sess } = await supabaseAdmin.from('admin_sessions').select('*').eq('id', sid).single()
    if (!sess) return res.status(404).json({ success: false, message: 'Not found' })

    // inactivity timeout
    const maxInactiveMs = Number(process.env.ADMIN_SESSION_MAX_INACTIVE_MINUTES || '30') * 60 * 1000
    const last = new Date(sess.last_activity).getTime()
    if (Date.now() - last > maxInactiveMs) {
      await supabaseAdmin.from('admin_sessions').delete().eq('id', sid)
      res.cookie('admin_session', '', { expires: new Date(0), httpOnly: true })
      return res.status(404).json({ success: false, message: 'Not found' })
    }

    // update last activity
    await supabaseAdmin.from('admin_sessions').update({ last_activity: new Date().toISOString() }).eq('id', sid)

    const { data: user } = await supabaseAdmin.from('admin_users').select('id,email,role').eq('id', sess.user_id).single()
    ;(req as any).admin = user

    // Log activity minimal
    await supabaseAdmin.from('admin_activity_log').insert({ user_id: user.id, action: `${req.method}`, path: req.path, ip, user_agent: req.headers['user-agent'] || '' })

    next()
  } catch (e) {
    return res.status(404).json({ success: false, message: 'Not found' })
  }
}
