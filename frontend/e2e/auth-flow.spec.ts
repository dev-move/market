import { expect, test } from '@playwright/test';

import { loginViaUi, signupViaUi } from './helpers';

test('user can sign up and access authenticated pages', async ({ page }) => {
  const { nickname } = await signupViaUi(page);

  await page.goto('/my-activity');
  await expect(page.getByRole('heading', { name: '내 활동' })).toBeVisible();
  await expect(page.getByText('내가 남긴 후기')).toBeVisible();

  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: '내 찜 목록' })).toBeVisible();

  await page.goto('/');
  await expect(page.getByText(`${nickname}님`)).toBeVisible();
});

test('user can login with username and password', async ({ page }) => {
  const { username, password } = await signupViaUi(page);
  await page.evaluate(() => localStorage.removeItem('market_auth_session'));
  await page.reload();

  await loginViaUi(page, username, password);
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
});
