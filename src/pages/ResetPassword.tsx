import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function ResetPassword() {
  const { resetPassword, loading, error } = useAuthStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  useEffect(() => {
    // basic validation
  }, [token, email]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(token, email, password);
      navigate('/login');
    } catch {}
  };

  return (
    <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 border rounded">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input type="password" placeholder="New password" className="w-full p-3 border rounded" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full px-8 py-3 bg-black text-white font-medium rounded hover:bg-red-500 transition-colors disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}