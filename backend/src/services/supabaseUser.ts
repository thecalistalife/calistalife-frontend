import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/utils/supabase';

export interface SupabaseUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string | null;
  phone?: string | null;
  email_verified: boolean;
  google_id?: string | null;
  refresh_token_hash?: string | null;
  refresh_token_expires?: string | null; // ISO date
  password_hash?: string | null;
  addresses?: any[] | null; // stored as JSON array
  created_at?: string;
  updated_at?: string;
}

const table = 'users';

export const users = {
  async findByEmail(email: string): Promise<SupabaseUser | null> {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .ilike('email', email)
      .maybeSingle();
    if (error) throw error;
    return data as any;
  },

  async findById(id: string): Promise<SupabaseUser | null> {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as any;
  },

  async create({ name, email, password }: { name: string; email: string; password: string; }): Promise<SupabaseUser> {
    const password_hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabaseAdmin
      .from(table)
      .insert({ name, email: email.toLowerCase(), password_hash, role: 'customer', email_verified: false })
      .select('*')
      .single();
    if (error) throw error;
    return data as any;
  },

  async update(id: string, fields: Partial<SupabaseUser>): Promise<SupabaseUser> {
    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as any;
  },

  async setRefreshToken(id: string, hash: string | null, expires: Date | null): Promise<void> {
    const updates: any = { refresh_token_hash: hash, refresh_token_expires: expires ? expires.toISOString() : null };
    const { error } = await supabaseAdmin.from(table).update(updates).eq('id', id);
    if (error) throw error;
  },

  async clearRefreshTokenByHash(hash: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(table)
      .update({ refresh_token_hash: null, refresh_token_expires: null })
      .eq('refresh_token_hash', hash);
    if (error) throw error;
  },

  async findByRefreshHash(hash: string): Promise<SupabaseUser | null> {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('refresh_token_hash', hash)
      .gt('refresh_token_expires', now)
      .maybeSingle();
    if (error) throw error;
    return data as any;
  },

  async setPassword(id: string, newPassword: string): Promise<void> {
    const password_hash = await bcrypt.hash(newPassword, 12);
    const { error } = await supabaseAdmin.from(table).update({ password_hash }).eq('id', id);
    if (error) throw error;
  },

  async comparePassword(user: SupabaseUser, candidate: string): Promise<boolean> {
    if (!user.password_hash) return false;
    return bcrypt.compare(candidate, user.password_hash);
  }
};
