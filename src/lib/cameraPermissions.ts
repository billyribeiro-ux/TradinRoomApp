/**
 * Camera Permissions Utility
 * Microsoft Standard - No null, uses undefined
 */

interface PermissionStatus {
  isSupported: boolean;
  isSecureContext: boolean;
  status: 'granted' | 'denied' | 'prompt';
  error?: string;
}

interface SecureContextCheck {
  isSecure: boolean;
  protocol: string;
}

export const cameraPermissions = {
  /**
   * Check if camera permissions are supported
   */
  checkPermissionStatus: async (): Promise<PermissionStatus> => {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        isSupported: false,
        isSecureContext: false,
        status: 'denied',
        error: 'getUserMedia not supported in this browser',
      };
    }

    // Check secure context
    const secureContext = cameraPermissions.checkSecureContext();
    
    if (!secureContext.isSecure && window.location.hostname !== 'localhost') {
      return {
        isSupported: false,
        isSecureContext: false,
        status: 'denied',
        error: 'Camera requires HTTPS (except localhost)',
      };
    }

    // Check actual permission if QueryPermissionAPI is available
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return {
          isSupported: true,
          isSecureContext: secureContext.isSecure,
          status: result.state,
        };
      } catch (error) {
        // QueryPermissionAPI not supported or camera not in the list
        return {
          isSupported: true,
          isSecureContext: secureContext.isSecure,
          status: 'prompt',
        };
      }
    }

    return {
      isSupported: true,
      isSecureContext: secureContext.isSecure,
      status: 'prompt',
    };
  },

  /**
   * Check if the current context is secure (HTTPS or localhost)
   */
  checkSecureContext: (): SecureContextCheck => {
    const isSecure = window.isSecureContext;
    const protocol = window.location.protocol;
    
    return {
      isSecure: isSecure || window.location.hostname === 'localhost',
      protocol,
    };
  },

  /**
   * Request camera permission
   */
  requestPermission: async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission request failed:', error);
      return false;
    }
  },

  /**
   * Get browser name
   */
  getBrowserName: (): string => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
    return 'Unknown';
  },

  /**
   * Check if camera is currently in use
   */
  isInUse: async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput' && device.label !== '');
    } catch {
      return false;
    }
  },

  /**
   * Get browser-specific instructions for enabling camera
   */
  getBrowserInstructions: (browser: string): string => {
    const instructions: Record<string, string> = {
      Chrome: 'Go to Settings > Privacy and security > Site settings > Camera. Ensure this site has permission.',
      Firefox: 'Click the camera icon in the address bar or go to Preferences > Privacy & Security > Permissions > Camera.',
      Safari: 'Go to Safari > Settings for This Website > Camera and select Allow.',
      Edge: 'Go to Settings > Cookies and site permissions > Camera. Ensure this site has permission.',
      Opera: 'Go to Settings > Privacy & Security > Site Settings > Camera.',
    };
    return instructions[browser] || 'Please enable camera access in your browser settings.';
  },

  /**
   * Request camera permission (alias for requestPermission)
   */
  requestCameraPermission: async (): Promise<boolean> => {
    return cameraPermissions.requestPermission();
  },
};
