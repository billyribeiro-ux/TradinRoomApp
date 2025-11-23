// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 5 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, unknown>;
}

interface NotificationServiceState {
  permission: NotificationPermissionState;
  isRequesting: boolean;
  lastRequestTime: number | undefined;
  isSupported: boolean;
  errorMessage: string | undefined;
}

class NotificationService {
  private state: NotificationServiceState = {
    permission: 'default',
    isRequesting: false,
    lastRequestTime: undefined,
    isSupported: false,
    errorMessage: undefined,
  };

  private listeners: Set<(state: NotificationServiceState) => void> = new Set();
  private requestQueue: Promise<boolean> | undefined  = undefined;
  private readonly MIN_REQUEST_INTERVAL = 5000;
  private readonly PERMISSION_CACHE_KEY = 'notification_permission_cache';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      this.state.isSupported = 'Notification' in window &&
                                typeof window.Notification !== 'undefined' &&
                                window.isSecureContext;

      if (!this.state.isSupported) {
        console.warn('[NotificationService] Notifications not supported in this environment');
        this.state.permission = 'unsupported';
        this.state.errorMessage = 'Browser notifications are not supported';
        return;
      }

      this.state.permission = window.Notification.permission as NotificationPermissionState;
      this.loadPermissionCache();

      console.log('[NotificationService] Initialized. Permission:', this.state.permission);
    } catch (error) {
      console.error('[NotificationService] Initialization failed:', error);
      this.state.isSupported = false;
      this.state.permission = 'unsupported';
      this.state.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private loadPermissionCache(): void {
    try {
      const cached = localStorage.getItem(this.PERMISSION_CACHE_KEY);
      if (cached) {
        const { permission, timestamp } = JSON.parse(cached);
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (timestamp > oneWeekAgo) {
          this.state.permission = permission;
        }
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to load permission cache:', error);
    }
  }

  private savePermissionCache(permission: NotificationPermissionState): void {
    try {
      localStorage.setItem(
        this.PERMISSION_CACHE_KEY,
        JSON.stringify({ permission, timestamp: Date.now() })
      );
    } catch (error) {
      console.warn('[NotificationService] Failed to save permission cache:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('[NotificationService] Listener error:', error);
      }
    });
  }

  subscribe(listener: (state: NotificationServiceState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  getState(): NotificationServiceState {
    return { ...this.state };
  }

  isGranted(): boolean {
    return this.state.permission === 'granted' && this.state.isSupported;
  }

  isSupported(): boolean {
    return this.state.isSupported;
  }

  canRequestPermission(): boolean {
    if (!this.state.isSupported) {
      return false;
    }

    if (this.state.permission === 'denied') {
      return false;
    }

    if (this.state.permission === 'granted') {
      return false;
    }

    if (this.state.isRequesting) {
      return false;
    }

    if (this.state.lastRequestTime) {
      const timeSinceLastRequest = Date.now() - this.state.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        return false;
      }
    }

    return true;
  }

  async requestPermission(): Promise<boolean> {
    if (this.requestQueue) {
      console.log('[NotificationService] Permission request already in progress, returning existing promise');
      return this.requestQueue;
    }

    if (!this.canRequestPermission()) {
      const reason = !this.state.isSupported
        ? 'not supported'
        : this.state.permission === 'denied'
        ? 'previously denied'
        : this.state.permission === 'granted'
        ? 'already granted'
        : this.state.isRequesting
        ? 'request in progress'
        : 'rate limited';

      console.warn(`[NotificationService] Cannot request permission: ${reason}`);
      return this.state.permission === 'granted';
    }

    this.requestQueue = this.executePermissionRequest();

    try {
      return await this.requestQueue;
    } finally {
      this.requestQueue  = undefined;
    }
  }

  private async executePermissionRequest(): Promise<boolean> {
    console.log('[NotificationService] Requesting notification permission...');

    this.state.isRequesting = true;
    this.state.errorMessage  = undefined;
    this.state.lastRequestTime = Date.now();
    this.notifyListeners();

    try {
      if (!this.state.isSupported || !window.Notification) {
        throw new Error('Notifications not supported');
      }

      const permission = await window.Notification.requestPermission();

      this.state.permission = permission as NotificationPermissionState;
      this.state.isRequesting = false;
      this.savePermissionCache(this.state.permission);

      console.log('[NotificationService] Permission result:', permission);

      this.notifyListeners();

      return permission === 'granted';
    } catch (error) {
      console.error('[NotificationService] Permission request failed:', error);

      this.state.isRequesting = false;
      this.state.errorMessage = error instanceof Error ? error.message : 'Permission request failed';
      this.notifyListeners();

      return false;
    }
  }

  async showNotification(config: NotificationConfig): Promise<boolean> {
    if (!this.isGranted()) {
      console.warn('[NotificationService] Cannot show notification: permission not granted');
      return false;
    }

    if (document.hidden === false) {
      console.log('[NotificationService] Skipping notification: document is visible');
      return false;
    }

    try {
      const notification = new window.Notification(config.title, {
        body: config.body,
        icon: config.icon || '/favicon.ico',
        tag: config.tag || `notification-${Date.now()}`,
        requireInteraction: config.requireInteraction ?? false,
        silent: config.silent ?? false,
        data: config.data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => {
        try {
          notification.close();
        } catch (err) {
          console.warn('[NotificationService] Failed to close notification:', err);
        }
      }, 5000);

      console.log('[NotificationService] Notification shown:', config.title);
      return true;
    } catch (error) {
      console.error('[NotificationService] Failed to show notification:', error);
      this.state.errorMessage = error instanceof Error ? error.message : 'Failed to show notification';
      this.notifyListeners();
      return false;
    }
  }

  async showTestNotification(): Promise<boolean> {
    if (!this.isGranted()) {
      console.warn('[NotificationService] Cannot show test notification: permission not granted');
      return false;
    }

    return this.showNotification({
      title: 'Notifications Enabled!',
      body: 'You will now receive notifications from the trading room.',
      icon: '/favicon.ico',
      tag: 'test-notification',
      requireInteraction: false,
    });
  }

  reset(): void {
    try {
      localStorage.removeItem(this.PERMISSION_CACHE_KEY);
      this.initialize();
      console.log('[NotificationService] Reset complete');
    } catch (error) {
      console.error('[NotificationService] Reset failed:', error);
    }
  }

  getPermissionInstructions(): string {
    if (!this.state.isSupported) {
      return 'Notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.';
    }

    if (this.state.permission === 'denied') {
      return 'Notifications are blocked. To enable:\n\n' +
             '1. Click the lock icon in your browser\'s address bar\n' +
             '2. Find "Notifications"\n' +
             '3. Select "Allow"\n' +
             '4. Refresh the page';
    }

    if (this.state.permission === 'default') {
      return 'Click the button below to enable notifications.';
    }

    return 'Notifications are enabled!';
  }
}

export const notificationService = new NotificationService();
