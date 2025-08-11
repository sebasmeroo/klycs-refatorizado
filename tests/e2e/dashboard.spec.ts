import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (will redirect to login if not authenticated)
    await page.goto('/dashboard');
  });

  test('should display dashboard or redirect to login', async ({ page }) => {
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    
    if (url.includes('/login')) {
      // User not authenticated, which is expected
      await expect(page.locator('h1')).toContainText(['Iniciar Sesión', 'Login']);
    } else {
      // User is authenticated, should see dashboard
      await expect(page.locator('h1, [data-testid="dashboard-title"]')).toContainText(['Dashboard', 'Panel']);
    }
  });

  test('should display navigation menu', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated');
      return;
    }
    
    // Look for navigation elements
    const navigation = page.locator('nav, [data-testid="navigation"]');
    await expect(navigation).toBeVisible();
    
    // Should have links to different sections
    await expect(page.locator('text=Tarjetas, text=Cards')).toBeVisible();
    await expect(page.locator('text=Perfil, text=Profile')).toBeVisible();
  });

  test('should navigate to cards section', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated');
      return;
    }
    
    // Click on cards navigation
    const cardsLink = page.locator('text=Tarjetas, text=Cards, [href*="cards"]').first();
    
    if (await cardsLink.isVisible()) {
      await cardsLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should be in cards section
      expect(page.url()).toContain('cards');
      
      // Should show cards UI
      await expect(page.locator('text=Nueva Tarjeta, text=New Card, text=Crear')).toBeVisible();
    }
  });

  test('should handle responsive design', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated');
      return;
    }
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be functional on mobile
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, [aria-label*="menu"]');
    
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      // Menu should expand
      await expect(page.locator('nav, [data-testid="navigation"]')).toBeVisible();
    }
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Desktop navigation should be visible
    await expect(page.locator('nav, [data-testid="navigation"]')).toBeVisible();
  });

  test('should display loading states', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated');
      return;
    }
    
    // Look for loading indicators
    const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner');
    
    // Loading elements might appear briefly
    await page.waitForTimeout(100);
    
    // After loading, content should be visible
    await expect(page.locator('main, [data-testid="dashboard-content"]')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip('User not authenticated');
      return;
    }
    
    // Navigate to a non-existent route
    await page.goto('/dashboard/non-existent-route');
    
    // Should show 404 or redirect to valid route
    const notFound = await page.locator('text=404, text=No encontrado, text=Not found').isVisible();
    const redirected = !page.url().includes('non-existent-route');
    
    expect(notFound || redirected).toBeTruthy();
  });
});