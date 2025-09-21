import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function GoogleLoginButton() {
  const divRef = useRef<HTMLDivElement>(null);
  const { googleLogin, loading } = useAuthStore();

  useEffect(() => {
    if (!clientId) return;
    // @ts-ignore
    const google = (window as any).google;
    if (!google || !divRef.current) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: any) => {
        const idToken = resp.credential as string;
        if (!idToken) return;
        try {
          await googleLogin(idToken);
          // redirect can be handled by caller or store consumer
        } catch {
          // swallow here; store handles error state
        }
      },
    });
    google.accounts.id.renderButton(divRef.current, { theme: 'outline', size: 'large', width: 360 });
  }, []);

  if (!clientId) return null;

  return (
    <div className="flex justify-center">
      <div ref={divRef} aria-busy={loading} />
    </div>
  );
}