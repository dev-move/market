import { expect, test } from '@playwright/test';

import { signupViaUi } from './helpers';

test('signed-in user can open an item and send a chat message', async ({ page }) => {
  await signupViaUi(page);

  await page.goto('/items');
  await expect(page.getByRole('heading', { name: '상품 리스트' })).toBeVisible();

  const firstProduct = page.locator('.product-card').first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();

  await expect(page.getByRole('button', { name: '판매자와 채팅' })).toBeVisible();
  await page.getByRole('button', { name: '판매자와 채팅' }).click();

  await page.waitForURL(/\/chat\/\d+/);
  await expect(page.getByRole('heading', { name: /님과의 채팅/ })).toBeVisible();

  const messageText = `playwright hello ${Date.now()}`;
  await page.getByLabel('메시지 입력').fill(messageText);
  await page.getByRole('button', { name: '전송' }).click();

  await expect(page.getByText(messageText)).toBeVisible();
});
