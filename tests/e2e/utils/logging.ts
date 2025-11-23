/**
 * E2E Test Logging Utilities - Microsoft Enterprise Pattern
 * Captures console, errors, network failures
 */

import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface TestLog {
  timestamp: string;
  type: 'console' | 'error' | 'network' | 'warning';
  message: string;
  details?: any;
}

export class TestLogger {
  private logs: TestLog[] = [];
  private testName: string;
  private artifactDir: string;

  constructor(testName: string) {
    this.testName = testName.replace(/[^a-z0-9]/gi, '-');
    this.artifactDir = path.join(process.cwd(), 'tests/e2e/artifacts', this.testName);
    
    // Create artifact directory
    if (!fs.existsSync(this.artifactDir)) {
      fs.mkdirSync(this.artifactDir, { recursive: true });
    }
  }

  addLog(type: TestLog['type'], message: string, details?: any) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      type,
      message,
      details,
    });
  }

  async attachToPage(page: Page) {
    // Capture console messages
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        this.addLog(type === 'error' ? 'error' : 'warning', msg.text());
      } else {
        this.addLog('console', `[${type}] ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      this.addLog('error', `Page Error: ${error.message}`, { stack: error.stack });
    });

    // Capture failed requests
    page.on('response', (response) => {
      if (response.status() >= 500) {
        this.addLog('network', `Network Error: ${response.status()} ${response.url()}`);
      }
    });

    // Capture request failures
    page.on('requestfailed', (request) => {
      this.addLog('network', `Request Failed: ${request.url()}`, {
        failure: request.failure()?.errorText,
      });
    });
  }

  async save() {
    const logFile = path.join(this.artifactDir, 'test-log.json');
    fs.writeFileSync(logFile, JSON.stringify(this.logs, null, 2));
  }

  getErrors(): TestLog[] {
    return this.logs.filter((log) => log.type === 'error');
  }

  getNetworkErrors(): TestLog[] {
    return this.logs.filter((log) => log.type === 'network');
  }

  hasErrors(): boolean {
    return this.getErrors().length > 0 || this.getNetworkErrors().length > 0;
  }
}

export async function assertNoConsoleErrors(logger: TestLogger, allowedPatterns: RegExp[] = []) {
  const errors = logger.getErrors();
  const filteredErrors = errors.filter((error) => {
    return !allowedPatterns.some((pattern) => pattern.test(error.message));
  });

  if (filteredErrors.length > 0) {
    throw new Error(
      `Console errors detected:\n${filteredErrors.map((e) => `  - ${e.message}`).join('\n')}`
    );
  }
}
