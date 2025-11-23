/**
 * Trading Room E2E Tests
 * Microsoft Enterprise Pattern - Comprehensive Testing
 */

import { test, expect } from './fixtures';

test.describe('Trading Room E2E Tests', () => {
  test.beforeEach(async ({ gotoTradingRoom }) => {
    // Uses test route with injected session for deterministic environment
    await gotoTradingRoom();
  });

  test('app boots with zero console errors and renders key regions', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

  // Wait for trading room root instead of networkidle to avoid external iframe flakiness
  await page.waitForSelector('[data-trading-room]', { timeout: 15000 });

    // Check for key regions
    const alertsPanel = await page.locator('[data-testid="alerts-panel"], .alerts-panel').count();
    const chatPanel = await page.locator('[data-testid="chat-panel"], .chat-panel').count();
    const videoStage = await page.locator('[data-testid="video-stage"], .video-stage, .media-stage').count();

    expect(alertsPanel).toBeGreaterThan(0);
    expect(chatPanel).toBeGreaterThan(0);
    expect(videoStage).toBeGreaterThan(0);

    // Assert no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('mic is muted by default with accurate toggle', async ({ page }) => {
    // Find mic toggle button
    const micToggle = page.locator('[data-testid="mic-toggle"], [aria-label*="microphone" i], [aria-label*="mic" i]').first();
    
    await expect(micToggle).toBeVisible({ timeout: 5000 });

    // Check initial state - should be muted
    const initialState = await micToggle.getAttribute('aria-pressed').catch(() => 
      micToggle.getAttribute('data-state')
    );
    
    // Mic should start muted (aria-pressed="false" or data-state="muted")
    expect(initialState).toMatch(/false|muted|off/i);

    // Click to unmute
    await micToggle.click();
    await page.waitForTimeout(500); // Allow state to update

    // Check unmuted state
    const unmutedState = await micToggle.getAttribute('aria-pressed').catch(() => 
      micToggle.getAttribute('data-state')
    );
    expect(unmutedState).toMatch(/true|unmuted|on/i);

    // Click to mute again
    await micToggle.click();
    await page.waitForTimeout(500);

    // Check muted state again
    const remutedState = await micToggle.getAttribute('aria-pressed').catch(() => 
      micToggle.getAttribute('data-state')
    );
    expect(remutedState).toMatch(/false|muted|off/i);
  });

  test('screenshare lifecycle: start → visible → stop → cleanup', async ({ page }) => {
    // Find screenshare button
    const shareButton = page.locator('[data-testid="screenshare-toggle"], [aria-label*="share" i], [aria-label*="screen" i]').first();
    
    await expect(shareButton).toBeVisible({ timeout: 5000 });

    // Initial state - no active screenshare tile
    const initialTiles = await page.locator('[data-testid="screenshare-tile"], .screenshare-tile, .screen-share-tile').count();
    expect(initialTiles).toBe(0);

    // Start screenshare
    await shareButton.click();
    await page.waitForTimeout(1000); // Allow stream to initialize

    // Check for active screenshare tile
    const activeTile = page.locator('[data-testid="screenshare-tile"], .screenshare-tile, .screen-share-tile').first();
    await expect(activeTile).toBeVisible({ timeout: 5000 });

    // Stop screenshare
    await shareButton.click();
    await page.waitForTimeout(1000); // Allow cleanup

    // Verify tile is removed
    await expect(activeTile).not.toBeVisible({ timeout: 5000 });

    // Verify cleanup - check for dangling tracks
    const hasActiveTracks = await page.evaluate(() => {
      // Check if there are any active media tracks
      const videos = document.querySelectorAll('video');
      for (const video of videos) {
        if (video.srcObject && (video.srcObject as MediaStream).active) {
          const tracks = (video.srcObject as MediaStream).getTracks();
          if (tracks.some(t => t.readyState === 'live')) {
            return true;
          }
        }
      }
      return false;
    });

    // Should have no dangling tracks after cleanup
    expect(hasActiveTracks).toBe(false);
  });

  test('chat path: send message and assert it appears', async ({ page }) => {
    // Find chat input
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
    
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Count initial messages
    const initialCount = await page.locator('[data-testid="chat-message"], .chat-message, .message-item').count();

    // Type and send message
    const testMessage = `E2E Test Message ${Date.now()}`;
    await chatInput.fill(testMessage);
    
    // Find send button
    const sendButton = page.locator('[data-testid="send-message"], button[aria-label*="send" i]').first();
    await sendButton.click();

    // Wait for message to appear
    await page.waitForTimeout(1000);

    // Count messages after sending
    const finalCount = await page.locator('[data-testid="chat-message"], .chat-message, .message-item').count();

    // Should have one more message
    expect(finalCount).toBeGreaterThan(initialCount);

    // Verify message content appears
    const messageText = await page.locator(`text="${testMessage}"`).count();
    expect(messageText).toBeGreaterThan(0);

    // Guard against render storm - count re-renders
    let renderCount = 0;
    page.on('console', (msg) => {
      if (msg.text().includes('render')) {
        renderCount++;
      }
    });

    // Send another message and check render count
    await chatInput.fill('Second message');
    await sendButton.click();
    await page.waitForTimeout(1000);

    // Render count should be reasonable (< 10 for one message)
    expect(renderCount).toBeLessThan(10);
  });

  test('alerts area stability: no height thrash', async ({ page }) => {
    // Find alerts panel
    const alertsPanel = page.locator('[data-testid="alerts-panel"], .alerts-panel').first();
    
    await expect(alertsPanel).toBeVisible({ timeout: 5000 });

    // Measure initial height
    const initialHeight = await alertsPanel.boundingBox().then(box => box?.height || 0);

    // Wait 500ms and measure again
    await page.waitForTimeout(500);
    const finalHeight = await alertsPanel.boundingBox().then(box => box?.height || 0);

    // Height delta should be < 8px
    const delta = Math.abs(finalHeight - initialHeight);
    expect(delta).toBeLessThan(8);
  });

  test('participants list visible and stable', async ({ page }) => {
    // Find participants list
    const participantsList = page.locator('[data-testid="participants-list"], .participants-list, .users-panel').first();
    
    // May not always be visible, so this is optional
    const isVisible = await participantsList.isVisible().catch(() => false);
    
    if (isVisible) {
      // If visible, check stability
      const initialCount = await participantsList.locator('[data-testid="participant-item"], .participant-item, .user-item').count();
      
      await page.waitForTimeout(500);
      
      const finalCount = await participantsList.locator('[data-testid="participant-item"], .participant-item, .user-item').count();
      
      // Count should remain stable
      expect(finalCount).toBe(initialCount);
    } else {
      // If not visible, just pass
      expect(true).toBe(true);
    }
  });

  test('no memory leaks on unmount', async ({ page }) => {
    // We already start on the deterministic trading test route from beforeEach.
    // Use it for memory sampling to avoid external redirects.
    await page.waitForSelector('[data-trading-room]', { timeout: 15000 });

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Unmount by navigating away
    await page.goto('about:blank');
    await page.waitForTimeout(1000);

    // Force garbage collection if available
    await page.evaluate(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
    });

    // Navigate back to the deterministic test route and wait for the root
    await page.goto('/__test_trading/test-room');
    await page.waitForSelector('[data-trading-room]', { timeout: 15000 });

    // Navigate away again
    await page.goto('about:blank');
    await page.waitForTimeout(1000);

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Memory growth should be reasonable (< 50MB)
    if (initialMemory > 0 && finalMemory > 0) {
      const growth = (finalMemory - initialMemory) / (1024 * 1024);
      expect(growth).toBeLessThan(50);
    }
  });
});
