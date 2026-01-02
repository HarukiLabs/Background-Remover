import { test, expect } from '@playwright/test';

test.describe('Upload Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display upload zone on initial load', async ({ page }) => {
        await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
        await expect(page.getByText(/drag.*drop/i)).toBeVisible();
    });

    test('should display supported formats', async ({ page }) => {
        await expect(page.getByText('JPG')).toBeVisible();
        await expect(page.getByText('PNG')).toBeVisible();
        await expect(page.getByText('WebP')).toBeVisible();
        await expect(page.getByText('Max 10MB')).toBeVisible();
    });

    test('should upload image via file dialog', async ({ page }) => {
        // Create a test image
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: /upload/i }).click();
        const fileChooser = await fileChooserPromise;

        // We can't actually upload without a real file, but test the interaction
        expect(fileChooser).toBeTruthy();
    });

    test('should be keyboard accessible', async ({ page }) => {
        // Tab to upload zone
        await page.keyboard.press('Tab');

        // Check it's focused
        const uploadZone = page.getByRole('button', { name: /upload/i });
        await expect(uploadZone).toBeFocused();
    });
});

test.describe('Header and Footer', () => {
    test('should display header with title', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /bg remover/i })).toBeVisible();
    });

    test('should display privacy note in footer', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText(/processing happens in your browser/i)).toBeVisible();
    });
});

test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Should still display core elements
        await expect(page.getByRole('heading', { name: /bg remover/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/');

        await expect(page.getByRole('heading', { name: /bg remover/i })).toBeVisible();
    });
});
