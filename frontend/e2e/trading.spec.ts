import { test, expect } from '@playwright/test';

test.describe('Trading Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login with demo user
    await page.fill('input[name="username"]', 'demo_user');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/');
  });

  test('should display dashboard after login', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Welcome back!')).toBeVisible();
  });

  test('should navigate to market page and display tickers', async ({ page }) => {
    await page.click('text=Market');
    await page.waitForURL('/market');
    
    await expect(page.locator('h1')).toContainText('Market');
    await expect(page.locator('text=Available Tickers')).toBeVisible();
  });

  test('should open trade modal and place a market buy order', async ({ page }) => {
    await page.click('text=Market');
    await page.waitForURL('/market');
    
    // Click on a ticker to open trade modal
    await page.click('text=AAPL');
    
    // Wait for trade modal to open
    await expect(page.locator('text=Place Order')).toBeVisible();
    
    // Fill in order details
    await page.fill('input[name="qty"]', '10');
    
    // Place the order
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Order placed successfully!')).toBeVisible();
  });

  test('should place a limit sell order', async ({ page }) => {
    await page.click('text=Market');
    await page.waitForURL('/market');
    
    // Click new trade button
    await page.click('text=New Trade');
    
    // Fill in order details
    await page.fill('input[name="symbol"]', 'AAPL');
    await page.click('text=Sell');
    await page.click('text=Limit');
    await page.fill('input[name="qty"]', '5');
    await page.fill('input[name="price"]', '200.00');
    
    // Place the order
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Order placed successfully!')).toBeVisible();
  });

  test('should view orders page and see placed orders', async ({ page }) => {
    // First place an order
    await page.click('text=Market');
    await page.click('text=AAPL');
    await page.fill('input[name="qty"]', '5');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Order placed successfully!');
    
    // Navigate to orders page
    await page.click('text=Orders');
    await page.waitForURL('/orders');
    
    await expect(page.locator('h1')).toContainText('Orders');
    await expect(page.locator('text=AAPL')).toBeVisible();
  });

  test('should cancel an open order', async ({ page }) => {
    // Place a limit order that won't fill immediately
    await page.click('text=Market');
    await page.click('text=New Trade');
    await page.fill('input[name="symbol"]', 'AAPL');
    await page.click('text=Buy');
    await page.click('text=Limit');
    await page.fill('input[name="qty"]', '1');
    await page.fill('input[name="price"]', '50.00'); // Very low price
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Order placed successfully!');
    
    // Navigate to orders page
    await page.click('text=Orders');
    await page.waitForURL('/orders');
    
    // Cancel the order
    await page.click('text=Cancel');
    await page.waitForSelector('text=Order cancelled successfully');
  });

  test('should view account page and see portfolio summary', async ({ page }) => {
    await page.click('text=Account');
    await page.waitForURL('/account');
    
    await expect(page.locator('h1')).toContainText('Account');
    await expect(page.locator('text=Cash Balance')).toBeVisible();
    await expect(page.locator('text=Total Value')).toBeVisible();
    await expect(page.locator('text=Daily P&L')).toBeVisible();
  });

  test('should reset account', async ({ page }) => {
    await page.click('text=Account');
    await page.waitForURL('/account');
    
    // Click reset account button
    await page.click('text=Reset Account');
    
    // Confirm the reset
    await page.on('dialog', dialog => dialog.accept());
    
    // Wait for success message
    await expect(page.locator('text=Account reset successfully')).toBeVisible();
  });
});


