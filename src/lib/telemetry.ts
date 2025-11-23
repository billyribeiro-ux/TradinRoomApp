// ============================================================================
// MICROSOFT TELEMETRY SERVICE - Enterprise Standard
// ============================================================================
import React, { useEffect } from 'react';

interface AppProps {
  Component: React.ComponentType;
  pageProps: Record<string, unknown>;
}

interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    appInsights?: {
      trackEvent: (event: { name: string; properties?: Record<string, unknown> }) => void;
      trackTrace: (data: { message: string; severity: string; properties?: LogContext }) => void;
      trackException: (data: { exception: Error; severityLevel: number; properties?: LogContext }) => void;
    };
  }
}

// Simple telemetry tracking (Microsoft Azure compatible)
const track = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Telemetry]', eventName, properties);
  }
  
  // Azure App Insights tracking
  try {
    window.appInsights?.trackEvent({ name: eventName, properties });
  } catch {}
};

// Initialize telemetry
export function initTelemetry() {
  if (typeof window === 'undefined') return;
  
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  if (!clarityId) return;
  
  // Microsoft Clarity script injection
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.innerHTML = `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${clarityId}");
  `;
  document.head.appendChild(script);
}

// Component-level tracking
export function useComponentTelemetry(componentName: string) {
  useEffect(() => {
    track(`${componentName}_mount`);
    return () => track(`${componentName}_unmount`);
  }, [componentName]);
}

// Next.js App wrapper
export function withTelemetry<P extends AppProps>(App: React.ComponentType<P>) {
  const TelemetryWrapper: React.FC<P> = (props) => {
    useEffect(() => {
      initTelemetry();
      track('App_init');
    }, []);
    
    return React.createElement(App, props);
  };
  
  TelemetryWrapper.displayName = 'TelemetryWrapper';
  return TelemetryWrapper;
}
