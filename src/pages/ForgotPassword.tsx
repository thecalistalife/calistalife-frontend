import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useToast } from '../hooks/useToast';

export default function ForgotPassword() {
  const { forgotPassword, loading, error } = useAuthStore();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent (if the email exists).');
    } catch (e: any) {
      toast.error('Failed to send reset link');
    }
  };

  return (
    <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 border rounded">
        <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {!sent ? (
          <form onSubmit={submit} className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-3 border rounded" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            <button type="submit" disabled={loading} className="w-full px-8 py-3 bg-black text-white font-medium rounded hover:bg-red-500 transition-colors disabled:opacity-50">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div className="text-green-600">If that email exists, a reset link has been sent.</div>
        )}
      </div>
    </div>
  );
}