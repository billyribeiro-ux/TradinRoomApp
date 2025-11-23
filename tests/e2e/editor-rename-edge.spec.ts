import { test, expect, type Page } from '@playwright/test';

// Edge-case validation for the rename dialog under /__test_notes route

test.describe('Editor Rename Dialog - edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/__test_notes');
    await page.getByTestId('notes-view').waitFor({ state: 'visible' });
    await page.getByTestId('notes-editor').waitFor({ state: 'visible' });
  });

  async function openRename(page: Page) {
    await page.getByTestId('note-menu-toggle').click();
    await page.getByRole('button', { name: 'Rename Note' }).click();
    await page.getByTestId('rename-input').waitFor({ state: 'visible' });
  }

  test('cancel flow leaves name unchanged', async ({ page }) => {
    // initial selected should be First Note
    await expect(page.getByTestId('note-title')).toHaveText('First Note');

    await openRename(page);
    await page.getByTestId('rename-input').fill('Cancel Name');
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Name should remain the original
    await expect(page.getByTestId('note-title')).toHaveText('First Note');
  });

  test('empty or whitespace-only names are rejected (disabled Save + error)', async ({ page }) => {
    await openRename(page);

    const input = page.getByTestId('rename-input');
    await input.fill('   ');

    // Save should be disabled
    const save = page.getByRole('button', { name: 'Save' });
    await expect(save).toBeDisabled();

    // Try pressing Enter (should not close the dialog)
    await input.press('Enter');

    // Dialog remains and error message is present
    await expect(page.getByTestId('rename-input')).toBeVisible();
    await expect(page.getByText('Name cannot be empty')).toBeVisible();

    // Close
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('trimming: leading/trailing spaces are trimmed on save', async ({ page }) => {
    await openRename(page);

    await page.getByTestId('rename-input').fill('   Trimmed Name   ');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByTestId('note-title')).toHaveText('Trimmed Name');
    await expect(page.getByRole('button', { name: 'Trimmed Name' })).toBeVisible();
  });

  test('duplicate names are rejected with an error', async ({ page }) => {
    // We auto-init with two notes: First Note (selected) and Second Note
    await openRename(page);

    await page.getByTestId('rename-input').fill('Second Note');

    // Save should be disabled and error visible
    const save = page.getByRole('button', { name: 'Save' });
    await expect(save).toBeDisabled();
    await expect(page.getByText('A note with this name already exists')).toBeVisible();

    // Close dialog and ensure name unchanged
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('button', { name: 'First Note' })).toBeVisible();
    await expect(page.getByTestId('note-title')).toHaveText('First Note');
  });
});
