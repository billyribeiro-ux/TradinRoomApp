/**
 * Enterprise Schema Verification Utility
 * Run this to verify live Supabase schema matches code expectations
 * Microsoft standard: Comprehensive verification with detailed reporting
 */

import { verifyAllCriticalTables } from '../services/verifySchema';

/**
 * Run comprehensive schema verification for all critical tables
 * Enterprise standard: Verifies chatmessages, alerts, polls, poll_votes, rooms, users
 * Can be called from browser console or component
 */
export async function runSchemaVerification() {
  // Enterprise standard: Only log in development
  if (import.meta.env.DEV) {
    console.debug('🔍 Starting Comprehensive Supabase Schema Verification...');
    console.debug('='.repeat(60));
  }
  
  try {
    const results = await verifyAllCriticalTables();
    
    if (import.meta.env.DEV) {
      console.debug('\n📊 VERIFICATION RESULTS:');
      console.debug('='.repeat(60));
      
      // Summary
      console.debug('\n📋 SUMMARY:');
      console.debug(`   Total Tables: ${results.summary.totalTables}`);
      console.debug(`   Tables Exist: ${results.summary.tablesExist}/${results.summary.totalTables} ${results.summary.tablesExist === results.summary.totalTables ? '✅' : '❌'}`);
      console.debug(`   Tables Match: ${results.summary.tablesMatch}/${results.summary.totalTables} ${results.summary.tablesMatch === results.summary.totalTables ? '✅' : '❌'}`);
      console.debug(`   Tables With Issues: ${results.summary.tablesWithIssues}`);
      
      // Chat Messages
      console.debug('\n💬 chatmessages Table:');
      console.debug(`   Exists: ${results.chatmessages.exists ? '✅' : '❌'}`);
      console.debug(`   Matches: ${results.chatmessages.matches ? '✅' : '❌'}`);
      if (results.chatmessages.columns.length > 0) {
        console.debug(`   Columns: ${results.chatmessages.columns.map(c => c.column_name).join(', ')}`);
      }
      if (results.chatmessages.discrepancies.length > 0) {
        console.debug('   ⚠️  DISCREPANCIES:');
        results.chatmessages.discrepancies.forEach(d => console.debug(`      - ${d}`));
      }
      
      // Alerts
      console.debug('\n🚨 alerts Table:');
      console.debug(`   Exists: ${results.alerts.exists ? '✅' : '❌'}`);
      console.debug(`   Matches: ${results.alerts.matches ? '✅' : '❌'}`);
      if (results.alerts.columns.length > 0) {
        console.debug(`   Columns: ${results.alerts.columns.map(c => c.column_name).join(', ')}`);
      }
      if (results.alerts.discrepancies.length > 0) {
        console.debug('   ⚠️  DISCREPANCIES:');
        results.alerts.discrepancies.forEach(d => console.debug(`      - ${d}`));
      }
      
      // Polls
      console.debug('\n📋 polls Table:');
      console.debug(`   Exists: ${results.polls.exists ? '✅' : '❌'}`);
      console.debug(`   Matches: ${results.polls.matches ? '✅' : '❌'}`);
      if (results.polls.columns.length > 0) {
        console.debug(`   Columns: ${results.polls.columns.map(c => c.column_name).join(', ')}`);
      }
      if (results.polls.discrepancies.length > 0) {
        console.debug('   ⚠️  DISCREPANCIES:');
        results.polls.discrepancies.forEach(d => console.debug(`      - ${d}`));
      }
      
      // Poll Votes
      console.debug('\n🗳️  poll_votes Table:');
      console.debug(`   Exists: ${results.pollVotes.exists ? '✅' : '❌'}`);
      console.debug(`   Matches: ${results.pollVotes.matches ? '✅' : '❌'}`);
      if (results.pollVotes.columns.length > 0) {
        console.debug(`   Columns: ${results.pollVotes.columns.map(c => c.column_name).join(', ')}`);
      }
      if (results.pollVotes.discrepancies.length > 0) {
        console.debug('   ⚠️  DISCREPANCIES:');
        results.pollVotes.discrepancies.forEach(d => console.debug(`      - ${d}`));
      }
      
      // Rooms
      console.debug('\n🏠 rooms Table:');
      console.debug(`   Exists: ${results.rooms.exists ? '✅' : '❌'}`);
      console.debug(`   Matches: ${results.rooms.matches ? '✅' : '❌'}`);
      if (results.rooms.columns.length > 0) {
        console.debug(`   Columns: ${results.rooms.columns.map(c => c.column_name).join(', ')}`);
      }
      if (results.rooms.discrepancies.length > 0) {
        console.debug('   ⚠️  DISCREPANCIES:');
        results.rooms.discrepancies.forEach(d => console.debug(`      - ${d}`));
      }
      
      // Users
      console.debug('\n👤 users Table:');
      console.debug(`   Exists: ${results.users.exists ? '✅' : '❌'}`);
      console.debug(`   Matches: ${results.users.matches ? '✅' : '❌'}`);
      if (results.users.columns.length > 0) {
        console.debug(`   Columns: ${results.users.columns.map(c => c.column_name).join(', ')}`);
      }
      if (results.users.discrepancies.length > 0) {
        console.debug('   ⚠️  DISCREPANCIES:');
        results.users.discrepancies.forEach(d => console.debug(`      - ${d}`));
      }
      
      // User Themes
      if (results.userThemes) {
        console.debug('\n🎨 user_themes Table:');
        console.debug(`   Exists: ${results.userThemes.exists ? '✅' : '❌'}`);
        console.debug(`   Matches: ${results.userThemes.matches ? '✅' : '❌'}`);
        if (results.userThemes.columns.length > 0) {
          console.debug(`   Columns: ${results.userThemes.columns.map(c => c.column_name).join(', ')}`);
        }
        if (results.userThemes.discrepancies.length > 0) {
          console.debug('   ⚠️  DISCREPANCIES:');
          results.userThemes.discrepancies.forEach(d => console.debug(`      - ${d}`));
        }
      }
      
      // Overall Result
      console.debug('\n' + '='.repeat(60));
      console.debug(`\n${results.allMatch ? '✅' : '❌'} Overall Schema Match: ${results.allMatch ? 'PASS' : 'FAIL'}`);
      
      if (!results.allMatch) {
        console.warn('\n⚠️  ACTION REQUIRED: Schema discrepancies detected!');
        console.warn('   Please review discrepancies above and update code or database.');
      } else {
        console.debug('\n✅ All schemas match expected structure!');
      }
    }
    
    return results;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Schema verification failed:', error);
    }
    throw error;
  }
}

// Make it available globally for easy testing (dev only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).verifySchema = runSchemaVerification;
}

