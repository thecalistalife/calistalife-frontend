import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

import GoogleLoginButton from '../components/GoogleLoginButton';
import { useToast } from '../hooks/useToast';

export default function Login() {
  const navigate = useNavigate();
  const { user, login, loading, error } = useAuthStore();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect to home as soon as a user exists (works for Google login as well)
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      // navigate is triggered by the effect when user is set
    } catch (e: any) {
      toast.error('Login failed');
    }
  };

  return (
    <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 border rounded">
        <h1 className="text-2xl font-bold mb-6">Sign in</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-3 bg-black text-white font-medium rounded hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="my-4 text-center text-sm text-gray-500">or</div>

        <GoogleLoginButton />

        <div className="mt-4 text-sm flex justify-between">
          <Link to="/register" className="text-blue-600">Create account</Link>
          <Link to="/forgot-password" className="text-blue-600">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}