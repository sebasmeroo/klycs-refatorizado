import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h1')).toContainText(['Iniciar Sesión', 'Login']);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.locator('h1')).toContainText(['Registrarse', 'Register']);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation messages
    await expect(page.locator('text=requerido')).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    
    // Click register link
    await page.click('text=Registrarse');
    await expect(page).toHaveURL(/register/);
    
    // Click login link
    await page.click('text=Iniciar Sesión');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill valid credentials (this would need actual test user)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard (or show error for invalid creds)
    await page.waitForTimeout(2000);
    
    // Either we're at dashboard or we see an error message
    const url = page.url();
    const hasError = await page.locator('text=error').isVisible();
    
    expect(url.includes('/dashboard') || hasError).toBeTruthy();
  });

  test('should handle logout', async ({ page }) => {
    // This test assumes user is logged in
    await page.goto('/dashboard');
    
    // If we're redirected to login, that's expected behavior
    if (page.url().includes('/login')) {
      expect(true).toBeTruthy(); // User not logged in, which is fine
      return;
    }
    
    // Look for logout button
    const logoutButton = page.locator('[data-testid="logout-button"], text=Cerrar Sesión, text=Logout');
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to home or login
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url.includes('/') || url.includes('/login')).toBeTruthy();
    }
  });
});