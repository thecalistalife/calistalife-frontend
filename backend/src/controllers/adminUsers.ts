import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/utils/supabase'

export const listAdmins = async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from('admin_users').select('id,email,role,is_active,created_at')
  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch admins' })
  return res.status(200).json({ success: true, data })
}

export const createAdmin = async (req: Request, res: Response) => {
  const caller = (req as any).admin
  if (!caller || (caller.role !== 'master')) return res.status(403).json({ success: false, message: 'Forbidden' })
  const { email, password, role = 'viewer' } = req.body as { email: string; password: string; role?: string }
  const password_hash = await bcrypt.hash(password, 12)
  const { data, error } = await supabaseAdmin.from('admin_users').insert({ email: email.toLowerCase(), password_hash, role, is_active: true }).select('id,email,role').single()
  if (error) return res.status(400).json({ success: false, message: error.message })
  return res.status(201).json({ success: true, data })
}

export const setAdminActive = async (req: Request, res: Response) => {
  const caller = (req as any).admin
  if (!caller || (caller.role !== 'master')) return res.status(403).json({ success: false, message: 'Forbidden' })
  const { id } = req.params
  const { is_active } = req.body as { is_active: boolean }
  const { error } = await supabaseAdmin.from('admin_users').update({ is_active }).eq('id', id)
  if (error) return res.status(400).json({ success: false, message: error.message })
  return res.status(200).json({ success: true })
}
