/**
 * Run E2E Tests Script
 * 
 * This script runs the E2E test suite and outputs results
 * 
 * Usage: tsx scripts/runE2ETests.ts
 */

import { runE2ETestSuite, generateTestReport } from '../src/utils/e2eTestSuite';

async function main() {
  console.log('🧪 Running Comprehensive E2E Test Suite...\n');
  console.log('='.repeat(60));
  
  try {
    const result = await runE2ETestSuite();
    const report = generateTestReport(result);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${result.totalTests}`);
    console.log(`Passed: ${result.passedTests} ✅`);
    console.log(`Failed: ${result.failedTests} ${result.failedTests > 0 ? '❌' : ''}`);
    console.log(`Pass Rate: ${((result.passedTests / result.totalTests) * 100).toFixed(1)}%`);
    
    if (result.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      result.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`\n  ${r.category}: ${r.testName}`);
          if (r.error) console.log(`    Error: ${r.error}`);
        });
    }
    
    if (result.issues.length > 0) {
      console.log('\n⚠️  ISSUES:');
      result.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      result.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📄 Full Report:\n');
    console.log(report);
    
    // Exit with appropriate code
    process.exit(result.failedTests > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

main();

