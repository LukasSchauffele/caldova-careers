import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    test('searches, clears, and handles unmatched roles', async ({ page }) => {
        await page.goto('/');

        const visibleCards = page.locator('[data-testid="role-card"]:visible');
        const firstTitle = (await visibleCards.first().getByTestId('role-title').textContent())!.trim();
        const titleFragment = firstTitle;
        const search = page.getByTestId('role-search');

        await test.step('filters roles by a matching title fragment', async () => {
            await search.fill(titleFragment);
            await expect(visibleCards).toHaveCount(1);
            await expect(visibleCards.first().getByTestId('role-title')).toHaveText(firstTitle);
        });

        await test.step('clears the search and restores every role', async () => {
            await search.fill('');
            await expect(visibleCards).toHaveCount(expectedRoleCount);
        });

        await test.step('shows an empty state for an unmatched title', async () => {
            await search.fill('role-title-that-does-not-exist');
            await expect(page.getByTestId('role-search-empty')).toBeVisible();
            await expect(visibleCards).toHaveCount(0);
        });
    });

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
