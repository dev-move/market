import { expect, test } from '@playwright/test';

import { signupViaUi } from './helpers';

test('signed-in user can add item to favorites and see it in favorites list', async ({ page }) => {
  await signupViaUi(page);

  await page.goto('/items');
  await expect(page.getByRole('heading', { name: '상품 리스트' })).toBeVisible();

  const firstProduct = page.locator('.product-card').first();
  await expect(firstProduct).toBeVisible();
  const productTitle = await firstProduct.locator('h3').textContent();
  await firstProduct.click();

  await expect(page.getByRole('button', { name: '찜하기' })).toBeVisible();
  await page.getByRole('button', { name: '찜하기' }).click();

  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: '내 찜 목록' })).toBeVisible();
  await expect(page.getByText(productTitle ?? '')).toBeVisible();
});
