import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../hooks/useToast';

export default function Register() {
  const navigate = useNavigate();
  const { user, register, loading, error } = useAuthStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      toast.success('Account created!');
      // navigation handled by effect after user set
    } catch (e: any) {
      toast.error('Registration failed');
    }
  };

  return (
    <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 border rounded">
        <h1 className="text-2xl font-bold mb-6">Create account</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            className="w-full p-3 border rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}