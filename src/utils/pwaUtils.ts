import { info, warn, error } from '@/utils/logger';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAUpdateInfo {
  isUpdateAvailable: boolean;
  showUpdatePrompt: () => void;
  skipWaiting: () => void;
}

class PWAService {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private updateAvailable = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializePWA();
  }

  private async initializePWA() {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupUpdateDetection();
        this.checkInstallStatus();
        this.setupConnectionMonitoring();
      } catch (err) {
        error('Failed to initialize PWA', err as Error, { component: 'PWAService' });
      }
    } else {
      warn('Service Worker not supported', { component: 'PWAService' });
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      info('Service Worker registered successfully', {
        component: 'PWAService',
        scope: this.serviceWorkerRegistration.scope
      });

      // Listen for SW messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      // Check for updates every 30 seconds when app is active
      if (document.visibilityState === 'visible') {
        setInterval(() => {
          this.serviceWorkerRegistration?.update();
        }, 30000);
      }

    } catch (err) {
      error('Service Worker registration failed', err as Error, { component: 'PWAService' });
    }
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as any;
      
      info('PWA install prompt available', { component: 'PWAService' });
      
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('pwa-install-available'));
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      info('PWA installed successfully', { component: 'PWAService' });
      
      // Send analytics event
      if (window.gtag) {
        window.gtag('event', 'pwa_installed', {
          event_category: 'PWA',
          event_label: 'User installed PWA'
        });
      }
      
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
  }

  private setupUpdateDetection(): void {
    if (!this.serviceWorkerRegistration) return;

    this.serviceWorkerRegistration.addEventListener('updatefound', () => {
      const newWorker = this.serviceWorkerRegistration!.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.updateAvailable = true;
            
            info('PWA update available', { component: 'PWAService' });
            
            // Dispatch event for UI to show update prompt
            window.dispatchEvent(new CustomEvent('pwa-update-available', {
              detail: {
                showUpdatePrompt: () => this.showUpdatePrompt(),
                skipWaiting: () => this.skipWaiting()
              }
            }));
          }
        });
      }
    });

    // Listen for SW taking control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      info('Service Worker updated and took control', { component: 'PWAService' });
      
      // Reload to get latest version
      if (this.updateAvailable) {
        window.location.reload();
      }
    });
  }

  private checkInstallStatus(): void {
    // Check if already installed
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      window.matchMedia('(display-mode: fullscreen)').matches ||
                      (window.navigator as any).standalone === true;

    if (this.isInstalled) {
      info('PWA is already installed', { component: 'PWAService' });
    }
  }

  private setupConnectionMonitoring(): void {
    const updateOnlineStatus = () => {
      const event = navigator.onLine ? 'online' : 'offline';
      
      info(`Connection status changed: ${event}`, { component: 'PWAService' });
      
      window.dispatchEvent(new CustomEvent(`pwa-${event}`));
      
      // Send analytics
      if (window.gtag) {
        window.gtag('event', `connection_${event}`, {
          event_category: 'PWA',
          event_label: `User went ${event}`
        });
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;
    
    if (data.type === 'CACHE_UPDATED') {
      info('Cache updated by Service Worker', { 
        component: 'PWAService',
        updatedFiles: data.updatedFiles 
      });
    }
    
    if (data.type === 'BACKGROUND_SYNC_SUCCESS') {
      info('Background sync completed successfully', {
        component: 'PWAService',
        syncedData: data.syncedData
      });
      
      window.dispatchEvent(new CustomEvent('pwa-background-sync-success', {
        detail: data.syncedData
      }));
    }
  }

  // Public methods

  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      warn('No install prompt available', { component: 'PWAService' });
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      info('Install prompt result', { 
        component: 'PWAService', 
        outcome 
      });
      
      // Send analytics
      if (window.gtag) {
        window.gtag('event', 'pwa_install_prompt', {
          event_category: 'PWA',
          event_label: outcome,
          value: outcome === 'accepted' ? 1 : 0
        });
      }
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
      
    } catch (err) {
      error('Install prompt failed', err as Error, { component: 'PWAService' });
      return false;
    }
  }

  public showUpdatePrompt(): void {
    const shouldUpdate = confirm(
      '¡Nueva versión disponible! ¿Quieres actualizar ahora para obtener las últimas mejoras?'
    );
    
    if (shouldUpdate) {
      this.skipWaiting();
    }
  }

  public skipWaiting(): void {
    if (this.serviceWorkerRegistration?.waiting) {
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  public isInstallAvailable(): boolean {
    return !!this.deferredPrompt;
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  public async clearCache(): Promise<void> {
    try {
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.active?.postMessage({ type: 'CLEAR_CACHE' });
        info('Cache cleared successfully', { component: 'PWAService' });
      }
    } catch (err) {
      error('Failed to clear cache', err as Error, { component: 'PWAService' });
    }
  }

  public async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        
        info('Storage estimate', {
          component: 'PWAService',
          usage: estimate.usage,
          quota: estimate.quota,
          usagePercentage: estimate.quota ? (estimate.usage! / estimate.quota * 100) : 0
        });
        
        return estimate;
      } catch (err) {
        error('Failed to get storage estimate', err as Error, { component: 'PWAService' });
      }
    }
    
    return null;
  }

  public async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        
        info('Persistent storage request', {
          component: 'PWAService',
          granted
        });
        
        return granted;
      } catch (err) {
        error('Failed to request persistent storage', err as Error, { component: 'PWAService' });
      }
    }
    
    return false;
  }

  public async shareContent(shareData: ShareData): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share(shareData);
        
        info('Content shared successfully', {
          component: 'PWAService',
          title: shareData.title,
          url: shareData.url
        });
        
        return true;
      } catch (err) {
        // User cancelled or error occurred
        warn('Share cancelled or failed', {
          component: 'PWAService',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    return false;
  }

  public getConnectionInfo(): { online: boolean; effectiveType?: string; downlink?: number } {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink
    };
  }

  public async registerBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        
        info('Background sync registered', {
          component: 'PWAService',
          tag
        });
      } catch (err) {
        error('Failed to register background sync', err as Error, {
          component: 'PWAService',
          tag
        });
      }
    }
  }
}

// Create singleton instance
export const pwaService = new PWAService();

// Export utility functions
export const PWAUtils = {
  showInstallPrompt: () => pwaService.showInstallPrompt(),
  isInstallAvailable: () => pwaService.isInstallAvailable(),
  isInstalled: () => pwaService.isAppInstalled(),
  isUpdateAvailable: () => pwaService.isUpdateAvailable(),
  clearCache: () => pwaService.clearCache(),
  getStorageEstimate: () => pwaService.getStorageEstimate(),
  requestPersistentStorage: () => pwaService.requestPersistentStorage(),
  shareContent: (data: ShareData) => pwaService.shareContent(data),
  getConnectionInfo: () => pwaService.getConnectionInfo(),
  registerBackgroundSync: (tag: string) => pwaService.registerBackgroundSync(tag)
};

export default pwaService;

// Global types for better TypeScript support
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}