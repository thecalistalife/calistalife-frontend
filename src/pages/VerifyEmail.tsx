import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function VerifyEmail() {
  const { verifyEmail, requestEmailVerification, loading, error } = useAuthStore();
  const [params] = useSearchParams();
  const [done, setDone] = useState(false);
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  useEffect(() => {
    const run = async () => {
      if (token && email) {
        try {
          await verifyEmail(token, email);
          setDone(true);
        } catch {}
      }
    };
    run();
  }, [token, email]);

  return (
    <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 border rounded text-center">
        <h1 className="text-2xl font-bold mb-6">Verify Email</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {done ? (
          <div className="text-green-600">Your email has been verified.</div>
        ) : (
          <div className="text-gray-600">Verifying...</div>
        )}
        <div className="mt-6">
          <button onClick={()=>requestEmailVerification()} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Resend verification</button>
        </div>
      </div>
    </div>
  );
}