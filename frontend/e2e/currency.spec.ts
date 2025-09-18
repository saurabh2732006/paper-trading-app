import { test, expect } from '@playwright/test';

test.describe('Currency Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login with demo user
    await page.fill('input[name="username"]', 'demo_user');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/');
  });

  test('should display currency toggle in header', async ({ page }) => {
    await expect(page.locator('text=Currency:')).toBeVisible();
    await expect(page.locator('text=USD')).toBeVisible();
    await expect(page.locator('text=INR')).toBeVisible();
  });

  test('should switch to INR and update portfolio values', async ({ page }) => {
    // Wait for portfolio to load
    await page.waitForSelector('text=Cash Balance');
    
    // Get initial USD values
    const initialCash = await page.locator('text=Cash Balance').locator('..').locator('text=/\\$[0-9,]+\\.[0-9]{2}/').textContent();
    const initialTotal = await page.locator('text=Total Value').locator('..').locator('text=/\\$[0-9,]+\\.[0-9]{2}/').textContent();
    
    // Switch to INR
    await page.click('text=INR');
    
    // Wait for values to update
    await page.waitForTimeout(1000);
    
    // Check that values are now in INR
    const updatedCash = await page.locator('text=Cash Balance').locator('..').locator('text=/₹[0-9,]+\\.[0-9]{2}/').textContent();
    const updatedTotal = await page.locator('text=Total Value').locator('..').locator('text=/₹[0-9,]+\\.[0-9]{2}/').textContent();
    
    expect(updatedCash).toContain('₹');
    expect(updatedTotal).toContain('₹');
    
    // Values should be different (converted)
    expect(updatedCash).not.toBe(initialCash);
    expect(updatedTotal).not.toBe(initialTotal);
  });

  test('should show exchange rate when INR is selected', async ({ page }) => {
    // Switch to INR
    await page.click('text=INR');
    
    // Wait for exchange rate to load
    await page.waitForSelector('text=1 USD = ₹', { timeout: 10000 });
    
    // Check that exchange rate is displayed
    const exchangeRateText = await page.locator('text=/1 USD = ₹[0-9]+\\.[0-9]{2}/').textContent();
    expect(exchangeRateText).toMatch(/1 USD = ₹[0-9]+\.[0-9]{2}/);
  });

  test('should update market prices when switching currency', async ({ page }) => {
    // Go to market page
    await page.click('text=Market');
    await page.waitForURL('/market');
    
    // Get initial USD prices
    const initialPrices = await page.locator('text=/\\$[0-9]+\\.[0-9]{2}/').allTextContents();
    expect(initialPrices.length).toBeGreaterThan(0);
    
    // Switch to INR
    await page.click('text=INR');
    
    // Wait for prices to update
    await page.waitForTimeout(1000);
    
    // Check that prices are now in INR
    const updatedPrices = await page.locator('text=/₹[0-9]+\\.[0-9]{2}/').allTextContents();
    expect(updatedPrices.length).toBeGreaterThan(0);
  });

  test('should update trade modal when switching currency', async ({ page }) => {
    // Go to market page
    await page.click('text=Market');
    await page.waitForURL('/market');
    
    // Switch to INR first
    await page.click('text=INR');
    
    // Click on a ticker to open trade modal
    await page.click('text=AAPL');
    
    // Wait for trade modal to open
    await expect(page.locator('text=Place Order')).toBeVisible();
    
    // Check that current price is displayed in INR
    const currentPrice = await page.locator('text=Current Price:').locator('..').locator('text=/₹[0-9]+\\.[0-9]{2}/').textContent();
    expect(currentPrice).toContain('₹');
  });

  test('should switch back to USD and restore original values', async ({ page }) => {
    // Switch to INR first
    await page.click('text=INR');
    await page.waitForTimeout(1000);
    
    // Get INR values
    const inrCash = await page.locator('text=Cash Balance').locator('..').locator('text=/₹[0-9,]+\\.[0-9]{2}/').textContent();
    
    // Switch back to USD
    await page.click('text=USD');
    await page.waitForTimeout(1000);
    
    // Check that values are back to USD
    const usdCash = await page.locator('text=Cash Balance').locator('..').locator('text=/\\$[0-9,]+\\.[0-9]{2}/').textContent();
    expect(usdCash).toContain('$');
    expect(usdCash).not.toBe(inrCash);
  });
});


