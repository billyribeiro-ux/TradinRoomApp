/**
 * Enterprise Auth Flow Validation Test
 * =====================================
 * Tests Microsoft/Google-grade authentication security:
 * - No auto-creation on login
 * - Email verification enforcement
 * - No auto-room-membership
 * - Explicit registration required
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

test.describe('Enterprise Auth Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should reject login for non-existent user', async ({ page }) => {
    // Try to log in with credentials that don't exist
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/Invalid email or password/i')).toBeVisible({ timeout: 5000 });
    
    // Should NOT create user automatically
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'nonexistent@example.com')
      .single();
    
    expect(data).toBeNull();
  });

  test('should enforce email verification on login', async ({ page }) => {
    // Create a test user without email verification
    const testEmail = `test-unverified-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';
    
    // Register via Supabase (simulating unverified user)
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:5173/auth/callback',
      }
    });

    expect(signUpError).toBeNull();
    expect(authData.user).toBeTruthy();

    // Create user record manually (simulating incomplete registration)
    await supabase.from('users').insert({
      id: authData.user!.id,
      email: testEmail,
      display_name: 'Test User',
      role: 'member'
    });

    // Try to log in without verifying email
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should show email verification error
    await expect(page.locator('text=/verify your email/i')).toBeVisible({ timeout: 5000 });
    
    // Should NOT be logged in
    await expect(page.locator('text=/Trading Room/i')).not.toBeVisible();

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user!.id);
  });

  test('should reject login if user record missing in database', async ({ page }) => {
    // Create auth user WITHOUT database record (orphaned auth user)
    const testEmail = `test-orphan-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';
    
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    expect(signUpError).toBeNull();
    expect(authData.user).toBeTruthy();

    // Manually confirm email (bypass verification for this test)
    await supabase.auth.admin.updateUserById(authData.user!.id, {
      email_confirm: true
    });

    // DO NOT create user record in public.users table
    // This simulates incomplete registration

    // Try to log in
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should show account not found error
    await expect(page.locator('text=/Account not found/i')).toBeVisible({ timeout: 5000 });
    
    // Should NOT be logged in
    await expect(page.locator('text=/Trading Room/i')).not.toBeVisible();

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user!.id);
  });

  test('should not auto-create room membership on access', async ({ page }) => {
    // Create and log in a valid user
    const testEmail = `test-member-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';
    
    // Register user properly
    const { data: authData } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    const userId = authData.user!.id;

    // Create user record
    await supabase.from('users').insert({
      id: userId,
      email: testEmail,
      display_name: 'Test User',
      role: 'member'
    });

    // Confirm email
    await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    // Create a test room
    const { data: roomData } = await supabase.from('rooms').insert({
      title: 'Test Room',
      tenant_id: '00000000-0000-0000-0000-000000000000', // Placeholder
      is_active: true
    }).select().single();

    const roomId = roomData!.id;

    // Log in
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for login
    await page.waitForTimeout(2000);

    // Try to access the room (should fail - no membership)
    await page.goto(`/room/${roomId}`);

    // Should show access denied or redirect
    await expect(page.locator('text=/not a member/i')).toBeVisible({ timeout: 5000 });

    // Verify NO membership was auto-created
    const { data: membership } = await supabase
      .from('room_memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .single();

    expect(membership).toBeNull();

    // Cleanup
    await supabase.from('rooms').delete().eq('id', roomId);
    await supabase.from('users').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
  });

  test('should allow login only after complete registration', async ({ page }) => {
    const testEmail = `test-complete-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';
    const testName = 'Complete User';

    // Register via UI
    await page.click('text=/Create Account/i');
    await page.fill('input[placeholder*="name"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', testPassword);
    await page.fill('input[placeholder*="Confirm"]', testPassword);
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=/check your email/i')).toBeVisible({ timeout: 5000 });

    // Verify user record was created in database
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, email, display_name, role')
      .eq('email', testEmail)
      .single();

    expect(userRecord).toBeTruthy();
    expect(userRecord!.email).toBe(testEmail);
    expect(userRecord!.display_name).toBe(testName);
    expect(userRecord!.role).toBe('member');

    // Manually confirm email for testing
    await supabase.auth.admin.updateUserById(userRecord!.id, {
      email_confirm: true
    });

    // Now login should work
    await page.click('text=/Sign In/i');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should successfully log in
    await expect(page.locator('text=/Login successful/i')).toBeVisible({ timeout: 5000 });

    // Cleanup
    await supabase.from('users').delete().eq('id', userRecord!.id);
    await supabase.auth.admin.deleteUser(userRecord!.id);
  });
});
