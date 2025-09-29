import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are loaded before client creation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required (set it in backend/.env)');
}

// Prefer anon key for the regular client; fall back to service key if anon is missing
const clientKey = supabaseAnonKey || supabaseServiceKey;
if (!clientKey) {
  throw new Error('Supabase key is required: set SUPABASE_ANON_KEY (preferred) or SUPABASE_SERVICE_ROLE_KEY');
}

// Client for general operations (with RLS)
export const supabase = createClient(supabaseUrl, clientKey);

// Admin client for operations that need to bypass RLS. Fallback to anon if service key is missing,
// which allows the server to start, but admin operations may fail due to RLS policies.
const adminKey = supabaseServiceKey || supabaseAnonKey!;
if (!supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon key. Admin operations may fail due to RLS.');
}
export const supabaseAdmin = createClient(supabaseUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database connection test
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('Supabase connection test:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};
