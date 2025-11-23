#!/usr/bin/env node
/**
 * ENTERPRISE MEMBERSHIP VERIFICATION SCRIPT
 * ==========================================
 * Validates user membership and role in Supabase
 * Run: node scripts/verify-membership.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔐 ENTERPRISE MEMBERSHIP VERIFICATION');
console.log('=====================================\n');

async function verifyMembership() {
  try {
    // 1. Check current session
    console.log('1️⃣  Checking authentication session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('⚠️  No active session - you need to log in first');
      console.log('   Run the app and sign in, then run this script again');
      return;
    }
    
    const userId = session.user.id;
    const userEmail = session.user.email;
    console.log('✅ Authenticated as:', userEmail);
    console.log('   User ID:', userId);
    console.log('');
    
    // 2. Check user record
    console.log('2️⃣  Checking user record in database...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, display_name, created_at')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ User query error:', userError.message);
      console.error('   Code:', userError.code);
      console.error('   Details:', userError.details);
    } else if (userData) {
      console.log('✅ User record found:');
      console.log('   Email:', userData.email);
      console.log('   Role:', userData.role || '(none)');
      console.log('   Display Name:', userData.display_name || '(none)');
      console.log('   Created:', userData.created_at);
    } else {
      console.log('⚠️  User record not found in users table');
    }
    console.log('');
    
    // 3. Check room memberships
    console.log('3️⃣  Checking room memberships...');
    const { data: memberships, error: membershipError } = await supabase
      .from('room_memberships')
      .select('id, room_id, role, joined_at, rooms(id, title)')
      .eq('user_id', userId);
    
    if (membershipError) {
      console.error('❌ Membership query error:', membershipError.message);
      console.error('   Code:', membershipError.code);
      console.error('   Details:', membershipError.details);
      console.error('   Hint:', membershipError.hint);
      console.log('');
      console.log('🚨 COMMON CAUSES:');
      console.log('   1. RLS policy blocking SELECT on room_memberships');
      console.log('   2. Infinite recursion in RLS policy (check for circular EXISTS)');
      console.log('   3. Missing permissions for authenticated users');
      console.log('');
      console.log('💡 RECOMMENDED FIX:');
      console.log('   Go to Supabase Dashboard → Authentication → Policies');
      console.log('   Check room_memberships table policies');
      console.log('   Ensure SELECT is allowed for authenticated users');
    } else if (!memberships || memberships.length === 0) {
      console.log('⚠️  No room memberships found');
      console.log('   User is not registered in any rooms');
      console.log('');
      console.log('💡 TO FIX: Add a membership record manually:');
      console.log('   1. Go to Supabase Dashboard → Table Editor → room_memberships');
      console.log('   2. Click "Insert" → "Insert row"');
      console.log('   3. Set:');
      console.log('      - user_id:', userId);
      console.log('      - room_id: (your room ID)');
      console.log('      - role: admin');
    } else {
      console.log(`✅ Found ${memberships.length} membership(s):\n`);
      memberships.forEach((m, i) => {
        console.log(`   ${i + 1}. Room: ${m.rooms?.title || m.room_id}`);
        console.log(`      Role: ${m.role}`);
        console.log(`      Joined: ${m.joined_at}`);
        console.log('');
      });
      
      const adminRooms = memberships.filter(m => m.role === 'admin');
      if (adminRooms.length > 0) {
        console.log(`✅ User has ADMIN role in ${adminRooms.length} room(s)`);
        console.log('   Whiteboard toolbar should be visible');
      } else {
        console.log('⚠️  User has NO admin roles');
        console.log('   Whiteboard toolbar will NOT be visible');
        console.log('');
        console.log('💡 TO FIX: Update role to admin:');
        console.log('   1. Go to Supabase Dashboard → Table Editor → room_memberships');
        console.log('   2. Find the row for this user');
        console.log('   3. Change role from "member" to "admin"');
      }
    }
    console.log('');
    
    // 4. Summary
    console.log('📊 VERIFICATION SUMMARY');
    console.log('======================');
    console.log('Session:', session ? '✅ Active' : '❌ None');
    console.log('User Record:', userData ? '✅ Found' : '⚠️  Missing');
    console.log('Memberships:', memberships ? `✅ ${memberships.length} found` : '❌ Query failed');
    console.log('Admin Access:', memberships?.some(m => m.role === 'admin') ? '✅ Yes' : '❌ No');
    
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

verifyMembership();
