/**
 * Environment Configuration
 */

export const environment = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  livekitUrl: import.meta.env.VITE_LIVEKIT_URL || '',
  appEnv: import.meta.env.MODE || 'development',
};

export function logEnvironmentConfig() {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log('[Environment] Config loaded:', {
      supabaseUrl: environment.supabaseUrl ? '✅ Set' : '❌ Missing',
      livekitUrl: environment.livekitUrl ? '✅ Set' : '❌ Missing',
      mode: environment.appEnv,
    });
  }
}

export function validateEnvironmentConfig() {
  const errors: string[] = [];
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

export default environment;
