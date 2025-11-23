import { test, expect } from '@playwright/test';

// This spec targets the test route /__test_notes that mounts NotesView with autoInit
// It verifies the Fluent UI rename dialog updates the note name.

test.describe('Editor Rename Dialog', () => {
  test('rename flow updates tab label', async ({ page }) => {
    await page.goto('http://localhost:5173/__test_notes');
    await page.getByTestId('notes-view').waitFor({ state: 'visible' });
    await page.getByTestId('notes-editor').waitFor({ state: 'visible' });

    // Open the note actions menu
    await page.getByTestId('note-menu-toggle').click();

    // Click Rename Note
    await page.getByRole('button', { name: 'Rename Note' }).click();

    // Dialog should appear; fill name and save
    const input = page.getByTestId('rename-input');
    await input.waitFor({ state: 'visible' });

    // Clear existing value and type a new one
    await input.fill('Renamed Note');

    await page.getByRole('button', { name: 'Save' }).click();

  // Verify the selected note label reflects the new name in the header
  await expect(page.getByTestId('note-title')).toHaveText('Renamed Note');

    // Verify the note tab label also updated (bottom list)
    await expect(page.getByRole('button', { name: 'Renamed Note' })).toBeVisible();
  });
});
