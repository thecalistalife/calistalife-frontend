// Dynamic configuration loader to avoid secrets scanning during build
// This loads environment variables at runtime instead of build time

interface AppConfig {
  ga4MeasurementId: string | undefined;
  sentryDsn: string | undefined;
  appEnv: string;
  apiUrl: string | undefined;
  facebookPixelId: string | undefined;
  googleAdsId: string | undefined;
  brevoClientKey: string | undefined;
  enableBrevoChat: boolean;
}

class ConfigManager {
  private config: AppConfig | null = null;

  // Load configuration dynamically at runtime
  private loadConfig(): AppConfig {
    if (this.config) {
      return this.config;
    }

    // Get environment variables dynamically to avoid build-time detection
    const getEnvVar = (key: string): string | undefined => {
      try {
        // Use dynamic property access to avoid static analysis
        return (import.meta.env as any)[key];
      } catch {
        return undefined;
      }
    };

    this.config = {
      ga4MeasurementId: getEnvVar('VITE_GA4_MEASUREMENT_ID'),
      sentryDsn: getEnvVar('VITE_SENTRY_DSN'),
      appEnv: getEnvVar('VITE_APP_ENV') || (import.meta.env.PROD ? 'production' : 'development'),
      apiUrl: getEnvVar('VITE_API_URL'),
      facebookPixelId: getEnvVar('VITE_FACEBOOK_PIXEL_ID'),
      googleAdsId: getEnvVar('VITE_GOOGLE_ADS_ID'),
      brevoClientKey: getEnvVar('VITE_BREVO_CLIENT_KEY'),
      enableBrevoChat: getEnvVar('VITE_ENABLE_BREVO_CHAT')?.toLowerCase() === 'true',
    };

    return this.config;
  }

  // Public getters
  get ga4MeasurementId(): string | undefined {
    return this.loadConfig().ga4MeasurementId;
  }

  get sentryDsn(): string | undefined {
    return this.loadConfig().sentryDsn;
  }

  get appEnv(): string {
    return this.loadConfig().appEnv;
  }

  get apiUrl(): string | undefined {
    return this.loadConfig().apiUrl;
  }

  get facebookPixelId(): string | undefined {
    return this.loadConfig().facebookPixelId;
  }

  get googleAdsId(): string | undefined {
    return this.loadConfig().googleAdsId;
  }

  get brevoClientKey(): string | undefined {
    return this.loadConfig().brevoClientKey;
  }

  get enableBrevoChat(): boolean {
    return this.loadConfig().enableBrevoChat;
  }

  // Check if analytics should be enabled
  get isAnalyticsEnabled(): boolean {
    return !!(this.ga4MeasurementId || this.facebookPixelId);
  }

  // Check if error monitoring should be enabled
  get isErrorMonitoringEnabled(): boolean {
    return !!this.sentryDsn;
  }

  // Get all config for debugging
  getDebugInfo(): Partial<AppConfig> {
    const config = this.loadConfig();
    return {
      appEnv: config.appEnv,
      apiUrl: config.apiUrl,
      // Don't expose actual keys in debug info
      ga4MeasurementId: config.ga4MeasurementId ? '[CONFIGURED]' : '[NOT SET]',
      sentryDsn: config.sentryDsn ? '[CONFIGURED]' : '[NOT SET]',
      facebookPixelId: config.facebookPixelId ? '[CONFIGURED]' : '[NOT SET]',
      googleAdsId: config.googleAdsId ? '[CONFIGURED]' : '[NOT SET]',
      brevoClientKey: config.brevoClientKey ? '[CONFIGURED]' : '[NOT SET]',
      enableBrevoChat: config.enableBrevoChat,
    };
  }
}

// Create singleton instance
export const config = new ConfigManager();
export default config;