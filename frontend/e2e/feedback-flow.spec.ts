import { expect, test } from '@playwright/test';

import {
  deleteOwnedItemByTitle,
  loginViaUi,
  logoutViaStorage,
  selectFirstRegion,
  signupViaUi,
} from './helpers';

test('non-owner can report an item', async ({ page }) => {
  let seller: Awaited<ReturnType<typeof signupViaUi>> | undefined;
  let title: string | undefined;
  try {
    seller = await signupViaUi(page);

    await page.goto('/items/new');
    title = `E2E 신고대상 ${Date.now()}`;
    await page.getByLabel('상품명').fill(title);
    await selectFirstRegion(page);
    await page.getByLabel('가격').fill('1000');
    await page.getByLabel('설명').fill('신고 테스트용');
    await page.getByRole('button', { name: '등록하기' }).click();
    await page.waitForURL(/\/items\/(\d+)/);
    const itemUrl = page.url();

    await logoutViaStorage(page);
    await signupViaUi(page);

    await page.goto(itemUrl);
    await expect(page.getByRole('heading', { name: '상품 신고' })).toBeVisible();
    await page.getByLabel('신고 사유').selectOption('부적절한 상품');
    await page.getByLabel('상세 내용').fill('E2E 테스트 신고입니다.');
    await page.getByRole('button', { name: '신고 접수' }).click();

    await expect(page.getByText('신고가 접수되었습니다.', { exact: true })).toBeVisible();
  } finally {
    if (seller && title) {
      await page.goto('/');
      await logoutViaStorage(page);
      await loginViaUi(page, seller.email, seller.password);
      await deleteOwnedItemByTitle(page, title);
    }
  }
});

test('buyer can leave review on sold item', async ({ page }) => {
  let seller: Awaited<ReturnType<typeof signupViaUi>> | undefined;
  let buyer: Awaited<ReturnType<typeof signupViaUi>> | undefined;
  let title: string | undefined;
  try {
    seller = await signupViaUi(page);

    await page.goto('/items/new');
    title = `E2E 후기대상 ${Date.now()}`;
    await page.getByLabel('상품명').fill(title);
    await selectFirstRegion(page);
    await page.getByLabel('가격').fill('2000');
    await page.getByLabel('설명').fill('후기 테스트용');
    await page.getByRole('button', { name: '등록하기' }).click();
    await page.waitForURL(/\/items\/(\d+)/);
    const itemUrl = page.url();

    await logoutViaStorage(page);
    buyer = await signupViaUi(page);

    await page.goto(itemUrl);
    await page.getByRole('button', { name: '판매자와 채팅' }).click();
    await page.waitForURL(/\/chat\/\d+/);

    await logoutViaStorage(page);
    await loginViaUi(page, seller.email, seller.password);

    await page.goto(itemUrl);
    await page.getByRole('link', { name: '상품 수정' }).click();
    await page.waitForURL(/\/items\/\d+\/edit/);
    await page.getByLabel('거래 상태').selectOption('판매완료');
    await page.getByRole('button', { name: '수정 저장' }).click();
    await page.waitForURL(/\/items\/\d+/);

    await logoutViaStorage(page);
    await loginViaUi(page, buyer.email, buyer.password);

    await page.goto(itemUrl);
    await expect(page.getByRole('heading', { name: '거래 후기' })).toBeVisible();
    await page.getByLabel('평점').selectOption('5');
    await page.getByLabel('후기 내용').fill('매우 만족스러운 거래였습니다.');
    await page.getByRole('button', { name: '후기 등록' }).click();

    await expect(page.getByText('후기가 등록되었습니다.')).toBeVisible();
    await expect(page.getByText('매우 만족스러운 거래였습니다.')).toBeVisible();
  } finally {
    if (seller && title) {
      await page.goto('/');
      await logoutViaStorage(page);
      await loginViaUi(page, seller.email, seller.password);
      await deleteOwnedItemByTitle(page, title);
    }
  }
});
