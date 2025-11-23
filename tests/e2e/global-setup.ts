/**
 * Global Setup for E2E Tests
 * Microsoft Enterprise Pattern - Environment Configuration
 */

async function globalSetup() {
  // Set E2E environment variables
  process.env.VITE_E2E = '1';
  process.env.NODE_ENV = 'test';
  
  // Supabase placeholders for E2E (use actual test credentials if available)
  if (!process.env.VITE_SUPABASE_URL) {
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  }
  if (!process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  }
  
  console.log('[E2E Setup] Environment configured for testing');
}

export default globalSetup;
