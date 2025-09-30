// PWA Service Worker Registration and Management
import { config } from './config';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private isUpdateAvailable = false;

  // Initialize PWA features
  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      await this.registerServiceWorker();
      this.setupInstallPrompt();
      this.setupUpdateNotifications();
      this.initializeNotifications();
    } catch (error) {
      console.error('PWA initialization failed:', error);
    }
  }

  // Register service worker
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return;
    }

    // Skip in development to avoid conflicts
    if (import.meta.env.DEV) {
      console.log('Service worker registration skipped in development');
      return;
    }

    try {
      // Wait for page load before registering
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker registered successfully:', this.swRegistration);

      // Check for updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available');
              this.isUpdateAvailable = true;
              this.showUpdateNotification();
            }
          });
        }
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
        
        if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
          this.showUpdateNotification();
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Setup install prompt handling
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('Install prompt available');
      e.preventDefault();
      this.installPrompt = e as any;
      
      // Show install button or banner
      this.showInstallBanner();
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.installPrompt = null;
      this.hideInstallBanner();
      
      // Track installation event
      if (window.gtag) {
        window.gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'app_installed'
        });
      }
    });
  }

  // Show install banner
  private showInstallBanner(): void {
    // Create install banner dynamically
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 400px;
        margin: 0 auto;
      ">
        <div style="flex: 1; margin-right: 16px;">
          <div style="font-weight: 600; margin-bottom: 4px;">Install CalistaLife</div>
          <div style="font-size: 14px; opacity: 0.9;">Get the app for a better shopping experience</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="pwa-install-btn" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
          ">Install</button>
          <button id="pwa-dismiss-btn" style="
            background: transparent;
            border: none;
            color: white;
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            opacity: 0.7;
            font-size: 18px;
          ">×</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Add event listeners
    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      this.promptInstall();
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallBanner();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.hideInstallBanner();
    }, 10000);
  }

  // Hide install banner
  private hideInstallBanner(): void {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Prompt user to install
  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      console.log('Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        this.hideInstallBanner();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  // Setup update notifications
  private setupUpdateNotifications(): void {
    // Listen for page visibility changes to check for updates
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.swRegistration) {
        this.swRegistration.update();
      }
    });
  }

  // Show update notification
  private showUpdateNotification(): void {
    // Create update notification
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        max-width: 300px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="font-weight: 600; margin-bottom: 8px;">Update Available</div>
        <div style="font-size: 14px; margin-bottom: 12px;">A new version of CalistaLife is ready</div>
        <button id="pwa-update-btn" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          margin-right: 8px;
        ">Update Now</button>
        <button id="pwa-update-dismiss" style="
          background: transparent;
          border: none;
          color: white;
          padding: 8px;
          cursor: pointer;
          opacity: 0.7;
        ">Later</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
      this.applyUpdate();
    });

    document.getElementById('pwa-update-dismiss')?.addEventListener('click', () => {
      notification.remove();
    });
  }

  // Apply service worker update
  private applyUpdate(): void {
    if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }

  // Initialize push notifications
  private async initializeNotifications(): Promise<void> {
    if (!('Notification' in window) || !this.swRegistration) {
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);

      if (permission === 'granted') {
        // Subscribe to push notifications if needed
        // This would typically involve your push notification service
        console.log('Notifications enabled');
      }
    } catch (error) {
      console.error('Notification setup failed:', error);
    }
  }

  // Public methods
  get canInstall(): boolean {
    return this.installPrompt !== null;
  }

  get isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true;
  }

  get hasUpdate(): boolean {
    return this.isUpdateAvailable;
  }

  // Check if app is running in standalone mode
  static isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Get network information
  static getNetworkInfo(): { type: string; effectiveType?: string; downlink?: number } {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType,
        downlink: connection.downlink
      };
    }
    
    return { type: 'unknown' };
  }
}

// Create singleton instance
export const pwa = new PWAManager();

// Initialize on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => pwa.init());
  } else {
    pwa.init();
  }
}

export default pwa;