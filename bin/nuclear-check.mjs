#!/usr/bin/env node
/**
 * Nuclear E2E Check Runner
 * Microsoft Enterprise Pattern - One-Shot Quality Gate
 * 
 * Runs: Prettier → ESLint Fix → TypeScript → Playwright
 * Fails fast with actionable guidance
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const STEPS = [
  {
    name: 'Prettier Format',
    command: 'npm',
    args: ['run', 'prettier:write'],
    failureGuidance: 'Fix formatting issues manually or check .prettierrc configuration',
    optional: true,
  },
  {
    name: 'ESLint Fix',
    command: 'npm',
    args: ['run', 'lint:fix'],
    failureGuidance: 'Review ESLint errors and fix manually. Check .eslintrc.cjs for rules',
    optional: true,
  },
  {
    name: 'TypeScript Check',
    command: 'npm',
    args: ['run', 'typecheck'],
    failureGuidance: 'Fix TypeScript errors. Run `npx tsc --noEmit` for details',
  },
  {
    name: 'Playwright Install',
    command: 'npx',
    args: ['playwright', 'install', '--with-deps'],
    failureGuidance: 'Install Playwright browsers manually',
    optional: true,
  },
  {
    name: 'E2E Tests',
    command: 'npm',
    args: ['run', 'test:e2e'],
    failureGuidance: 'Check test failures in playwright-report/index.html',
  },
];

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`▶ Running: ${command} ${args.join(' ')}`);
    console.log(`${'='.repeat(60)}\n`);

    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('\n🚀 NUCLEAR E2E CHECK - Starting...\n');
  console.log(`Project Root: ${projectRoot}\n`);

  let failedStep = null;

  for (const step of STEPS) {
    try {
      await runCommand(step.command, step.args, projectRoot);
      console.log(`\n✅ ${step.name} - PASSED\n`);
    } catch (error) {
      if (step.optional) {
        console.log(`\n⚠️  ${step.name} - SKIPPED (optional)\n`);
        continue;
      }

      console.error(`\n❌ ${step.name} - FAILED\n`);
      console.error(`Error: ${error.message}\n`);
      console.error(`📋 Next Steps:`);
      console.error(`   ${step.failureGuidance}\n`);
      
      failedStep = step.name;
      break;
    }
  }

  if (failedStep) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(`❌ NUCLEAR CHECK FAILED at: ${failedStep}`);
    console.error(`${'='.repeat(60)}\n`);
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ NUCLEAR CHECK PASSED - All quality gates cleared!`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`📊 View test report: npx playwright show-report`);
  console.log(`📹 View traces: test-results/*/trace.zip\n`);
}

main().catch((error) => {
  console.error('\n💥 Nuclear check crashed:', error);
  process.exit(1);
});
