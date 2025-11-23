/**
 * E2E Test Runner
 * Automatically runs tests when loaded in dev mode
 */

import { runE2ETestsWithReport } from './e2eTestSuite';

/**
 * Auto-run tests in dev mode (can be disabled)
 */
export async function autoRunTests() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    // Check if auto-run is enabled (can be disabled via localStorage)
    const autoRunDisabled = localStorage.getItem('e2e-tests-auto-run-disabled');
    
    if (!autoRunDisabled) {
      console.log('🧪 E2E Test Suite: Auto-running tests...');
      console.log('💡 To disable auto-run: localStorage.setItem("e2e-tests-auto-run-disabled", "true")');
      
      try {
        const { result } = await runE2ETestsWithReport();
        
        // Log summary
        console.log('\n✅ Test Suite Complete');
        console.log(`   Passed: ${result.passedTests}/${result.totalTests}`);
        console.log(`   Failed: ${result.failedTests}/${result.totalTests}`);
        
        // Show failed tests
        if (result.failedTests > 0) {
          console.log('\n❌ Failed Tests:');
          result.results.filter(t => !t.passed).forEach(test => {
            console.log(`   • ${test.category} - ${test.testName}`);
            if (test.error) {
              console.log(`     Error: ${test.error}`);
            }
          });
        }
        
        // Store results in window for easy access
        (window as unknown as Record<string, unknown>).lastE2ETestResult = result;
        (window as unknown as Record<string, unknown>).lastE2ETestReport = result.results;
        
      } catch (error) {
        console.error('❌ Test suite failed to run:', error);
      }
    }
  }
}

// Auto-run on import (if in dev mode)
if (import.meta.env.DEV) {
  // Delay auto-run slightly to ensure app is initialized
  setTimeout(() => {
    autoRunTests().catch(console.error);
  }, 2000);
}

