/**
 * main.tsx — Revolution Trading Room (Enterprise Entry)
 * ------------------------------------------------------------
 * - Loads Fluent Hybrid global styles (index.css + Tailwind)
 * - Validates environment (.env + Supabase URLs)
 * - Initializes sound, Supabase preconnect, and Spotify SDK preload
 * - Integrates with Fluent motion variables and theme tokens
 * - Tracks Web Vitals in production
 */

// ═══════════════════════════════════════════════════════════════
// 🔒 MICROSOFT ENTERPRISE CONSOLE OVERRIDE
// ═══════════════════════════════════════════════════════════════
// MUST be FIRST - Initialize production console before any other code
// Silences all debug/info/log statements in production
// Only errors and warnings are logged in production
// ═══════════════════════════════════════════════════════════════
import { initializeProductionConsole } from './utils/productionConsole';
initializeProductionConsole();

// ═══════════════════════════════════════════════════════════════
// 🛡️ GLOBAL ERROR HANDLERS - Microsoft Production Standard
// ═══════════════════════════════════════════════════════════════
initializeGlobalErrorHandlers();

// Test utilities disabled for production-grade console cleanliness

// ═══════════════════════════════════════════════════════════════
// 🔇 SUPPRESS AudioContext Warnings (Microsoft Pattern)
// ═══════════════════════════════════════════════════════════════
// MUST be the FIRST code executed before any imports
// Suppresses browser AudioContext autoplay warnings from LiveKit
// These warnings are expected and handled - audio enables on user click
// ═══════════════════════════════════════════════════════════════
(function suppressAudioContextWarnings() {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args: Parameters<typeof console.error>) {
    const message = String(args[0] || '');
    // Suppress AudioContext autoplay policy messages
    if (message.includes('AudioContext') && message.includes('not allowed')) {
      return; // Suppress - this is expected behavior
    }
    originalError.apply(console, args);
  };
  
  console.warn = function(...args: Parameters<typeof console.warn>) {
    const message = String(args[0] || '');
    // Suppress AudioContext warnings
    if (message.includes('AudioContext') || message.includes('user gesture')) {
      return; // Suppress - this is expected behavior
    }
    originalWarn.apply(console, args);
  };
})();

// StrictMode removed to prevent double mount during development
import { createRoot } from 'react-dom/client';

import App from './app/App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css'; // ✅ Global Fluent Hybrid stylesheet
import { validateEnvironmentConfig, logEnvironmentConfig } from "./config/environment";
import { supabase } from './lib/supabase';
import { initializeSoundService } from './services/soundService';
import { initializeGlobalErrorHandlers } from './utils/globalErrorHandlers';

// Validate environment configuration on startup
validateEnvironmentConfig();
logEnvironmentConfig();

// Initialize sound service
initializeSoundService();

// Microsoft Pattern: Don't test session here - authStore.initialize() handles it
// Removed redundant supabase.auth.getSession() call to prevent race conditions

// Removed duplicate createRoot call - using the one at line 150
// ═══════════════════════════════════════════════════════════════
// 1️⃣ Environment Validation
// ═══════════════════════════════════════════════════════════════
function validateEnvironment() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  // E2E TEST ROUTE FAST-PATH: Skip hard failures for missing env on test-only routes
  // This allows Playwright to mount /__test_whiteboard without requiring full backend configuration.
  const isE2ERoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/__test_');

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isE2ERoute) {
      console.warn('[ENV] Skipping Supabase configuration enforcement for E2E test route');
    } else {
      throw new Error('Missing Supabase configuration. Please check your .env file.');
    }
  }

  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    if (isE2ERoute) {
      console.warn('[ENV] Supabase URL invalid, but tolerated in E2E mode');
    } else {
      throw new Error('Invalid Supabase URL in configuration.');
    }
  }

  const envValidation = validateEnvironmentConfig();
  if (!envValidation.valid) {
    console.warn('[APP] Environment configuration warnings:');
    envValidation.errors.forEach((error) => console.warn(`  - ${error}`));

    const criticalErrors = envValidation.errors.filter(
      (err) => err.includes('required') || err.includes('must use HTTPS')
    );

    if (criticalErrors.length > 0 && import.meta.env.PROD && !isE2ERoute) {
      throw new Error(`Critical configuration errors:\n${criticalErrors.join('\n')}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 2️⃣ Validate + Log Environment
// ═══════════════════════════════════════════════════════════════
try {
  validateEnvironment();
  // Environment validated - silent success

  if (import.meta.env.DEV) {
    logEnvironmentConfig();
  }
} catch (error) {
  console.error('[APP] Configuration error:', error);

  // Render a graceful fallback for misconfigured environments
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: #fff; font-family: system-ui;">
      <div style="text-align: center; max-width: 600px; padding: 2rem;">
        <h1 style="color: #ef4444; margin-bottom: 1rem;">Configuration Error</h1>
        <p style="color: #94a3b8; margin-bottom: 1.5rem;">${
          error instanceof Error ? error.message : 'Unknown error'
        }</p>
        <p style="color: #64748b; font-size: 0.875rem;">Please check your <strong>.env</strong> file and restart the app.</p>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Reload</button>
      </div>
    </div>
  `;
  throw error;
}

// ═══════════════════════════════════════════════════════════════
// 3️⃣ Initialize Supabase Session (preconnect)
// ═══════════════════════════════════════════════════════════════
supabase.auth.getSession().catch(() => {
  // Silent preconnect - errors handled by auth flow
});

// ═══════════════════════════════════════════════════════════════
// 4️⃣ Initialize Sound Service (on user interaction)
// ═══════════════════════════════════════════════════════════════
let soundInitialized = false;
const initializeAudioOnInteraction = () => {
  if (soundInitialized) return;
  soundInitialized = true;

  initializeSoundService().catch(() => {
    // Silent audio init failure - non-critical
  });

  document.removeEventListener('click', initializeAudioOnInteraction);
  document.removeEventListener('keydown', initializeAudioOnInteraction);
  document.removeEventListener('touchstart', initializeAudioOnInteraction);
};

document.addEventListener('click', initializeAudioOnInteraction, { once: true, passive: true });
document.addEventListener('keydown', initializeAudioOnInteraction, { once: true, passive: true });
document.addEventListener('touchstart', initializeAudioOnInteraction, { once: true, passive: true });

// ═══════════════════════════════════════════════════════════════
// 5️⃣ Preload Spotify SDK (performance optimization)
// ═══════════════════════════════════════════════════════════════
if (!document.querySelector('script[src*="spotify-player"]')) {
  const spotifyScript = document.createElement('script');
  spotifyScript.src = 'https://sdk.scdn.co/spotify-player.js';
  spotifyScript.async = true;
  spotifyScript.id = 'spotify-sdk-script';
  document.head.appendChild(spotifyScript);
}

// ═══════════════════════════════════════════════════════════════
// 6️⃣ Remove LiveKit SDK Debug UI (Microsoft Way - Multi-Layer Aggressive)
// LiveKit streaming functionality preserved - only debug UI removed
// ═══════════════════════════════════════════════════════════════
(function removeLiveKitDebugUI() {
  let removalCount = 0;
  
  // Aggressive removal function targeting exact HTML structure (silent operation)
  const removeLiveKitStatus = () => {
    // Method 1: Direct class targeting (exact structure)
    document.querySelectorAll('.livekit-status').forEach(el => {
      removalCount++;
      el.remove();
    });
    
    // Method 2: Find by content + position (backup for any variations)
    document.querySelectorAll('div').forEach(el => {
      const text = el.textContent || '';
      if (text.includes('Connected') && text.includes('participant')) {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed') {
          removalCount++;
          el.remove();
        }
      }
    });
    
    // Method 3: Target child elements that make up the status
    document.querySelectorAll('.status-indicator, .status-text, .participant-count').forEach(el => {
      const parent = el.closest('.livekit-status');
      if (parent) {
        removalCount++;
        parent.remove();
      }
    });
  };

  // LAYER 1: Run immediately on script load
  removeLiveKitStatus();
  
  // LAYER 2: Interval-based removal (runs every 500ms for 10 seconds - less aggressive to reduce console spam)
  const intervalId = setInterval(() => {
    removeLiveKitStatus();
  }, 500);
  
  // Stop interval after 10 seconds (reduced from 30s)
  setTimeout(() => {
    clearInterval(intervalId);
    // Only log summary once if any removals happened
    if (import.meta.env.DEV && removalCount > 0) {
      console.log(`[APP] LiveKit debug UI removed ${removalCount} time(s)`);
    }
  }, 10000);
  
  // LAYER 3: DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      removeLiveKitStatus();
    });
  } else {
    removeLiveKitStatus();
  }

  // LAYER 4: MutationObserver for real-time detection
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            if (
              node.classList?.contains('livekit-status') ||
              node.classList?.toString().includes('livekit') ||
              node.querySelector?.('.livekit-status') ||
              node.querySelector?.('.participant-count') ||
              (node.textContent?.includes('Connected') && node.textContent?.includes('participant'))
            ) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
      if (shouldCheck) break;
    }

    if (shouldCheck) {
      setTimeout(removeLiveKitStatus, 0);
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
})();

// ═══════════════════════════════════════════════════════════════
// 7️⃣ Render Application Root with Error Boundary
// ═══════════════════════════════════════════════════════════════
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// ═══════════════════════════════════════════════════════════════
// 8️⃣ Performance Monitoring (Production Only)
// ═══════════════════════════════════════════════════════════════
if (import.meta.env.PROD) {
  import('./lib/monitoring')
    .then(({ initializeWebVitals }) => {
      initializeWebVitals();
    })
    .catch((err) => {
      console.warn('[APP] ⚠️ Failed to initialize Web Vitals:', err);
    });
}

