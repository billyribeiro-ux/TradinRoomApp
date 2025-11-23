// ============================================================================
// MICROSOFT DEPLOYMENT VALIDATION - Enterprise Standard
// ============================================================================
import { execSync } from 'child_process';

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

function validateEnv() {
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      throw new Error(`Missing environment variable: ${varName}`);
    }
  });
}

function validateMigrations() {
  try {
    execSync('supabase db remote commit', { stdio: 'pipe' });
  } catch (error) {
    const err = error as Error;
    throw new Error(`Migration validation failed: ${err.message}`);
  }
}

function validateTypeScript() {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
  } catch (error) {
    const err = error as Error;
    throw new Error(`TypeScript validation failed: ${err.message}`);
  }
}

function main() {
  try {
    console.log('[🔍] Starting Microsoft Enterprise Validation...\n');
    
    console.log('[1/3] Validating environment variables...');
    validateEnv();
    console.log('✅ Environment variables validated\n');
    
    console.log('[2/3] Validating TypeScript compilation...');
    validateTypeScript();
    console.log('✅ TypeScript compilation validated\n');
    
    console.log('[3/3] Validating database migrations...');
    validateMigrations();
    console.log('✅ Database migrations validated\n');
    
    console.log('[✅] Microsoft Validation Passed - Ready for Production');
    process.exit(0);
  } catch (error) {
    const err = error as Error;
    console.error(`\n[❌] Validation Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
