declare global {
  interface Window {
    sendinblue?: any;
  }
}

export function loadBrevo(maKey: string | undefined) {
  if (!maKey || typeof window === 'undefined') return;
  const w = window as any;
  if (!w.sendinblue) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://sibautomation.com/sa.js?key=${encodeURIComponent(maKey)}`;
    document.head.appendChild(s);
    w.sendinblue = w.sendinblue || function() {
      (w.sendinblue.q = w.sendinblue.q || []).push(arguments);
    };
  }
  try { w.sendinblue('page'); } catch {}
}

export function identifyBrevo(email: string, attributes?: Record<string, any>) {
  try {
    window.sendinblue && window.sendinblue('identify', { email, ...attributes });
  } catch {}
}

export function trackBrevo(event: string, props?: Record<string, any>) {
  try {
    window.sendinblue && window.sendinblue('track', event, props || {});
  } catch {}
}
