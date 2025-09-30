import * as Sentry from '@sentry/react';
import { config } from './config';

export function initMonitoring() {
  const dsn = config.sentryDsn;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: config.appEnv,
    tracesSampleRate: 0.2,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

export async function initWebVitals() {
  try {
    const { onCLS, onFID, onLCP } = await import('web-vitals');
    // Report to Sentry as breadcrumbs/measurements
    const report = (name: string, value: number) => {
      if ((Sentry as any).getCurrentHub) {
        Sentry.addBreadcrumb({ category: 'web-vitals', message: `${name}:${value.toFixed(2)}`, level: 'info' });
      } else {
        // eslint-disable-next-line no-console
        console.info(`[WebVitals] ${name}: ${value.toFixed(2)}`);
      }
    };
    onCLS((m) => report('CLS', m.value));
    onFID((m) => report('FID', m.value));
    onLCP((m) => report('LCP', m.value));
  } catch {
    // ignore
  }
}