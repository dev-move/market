import { expect, test } from '@playwright/test';

import { deleteOwnedItemByTitle, selectFirstRegion, signupViaUi } from './helpers';

test('signed-in user can create a new item', async ({ page }) => {
  let title: string | undefined;
  try {
    await signupViaUi(page);

    await page.goto('/items/new');
    await expect(page.getByRole('heading', { name: '상품 등록' })).toBeVisible();

    title = `E2E 상품 ${Date.now()}`;
    await page.getByLabel('상품명').fill(title);
    await selectFirstRegion(page);
    await page.getByLabel('가격').fill('10000');
    await page.getByLabel('설명').fill('E2E 테스트용 상품입니다.');

    await page.getByRole('button', { name: '등록하기' }).click();

    await page.waitForURL(/\/items\/\d+/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  } finally {
    if (title) {
      await deleteOwnedItemByTitle(page, title);
    }
  }
});

test('owner can edit item and update status', async ({ page }) => {
  let cleanupTitle: string | undefined;
  try {
    await signupViaUi(page);

    await page.goto('/items/new');
    const title = `E2E 수정대상 ${Date.now()}`;
    await page.getByLabel('상품명').fill(title);
    await selectFirstRegion(page);
    await page.getByLabel('가격').fill('5000');
    await page.getByLabel('설명').fill('수정 테스트용');
    await page.getByRole('button', { name: '등록하기' }).click();
    await page.waitForURL(/\/items\/\d+/);
    cleanupTitle = title;

    await page.getByRole('link', { name: '상품 수정' }).click();
    await page.waitForURL(/\/items\/\d+\/edit/);
    await expect(page.getByRole('heading', { name: '상품 수정' })).toBeVisible();

    const newTitle = `${title} (수정됨)`;
    await page.getByLabel('상품명').fill(newTitle);
    await page.getByLabel('거래 상태').selectOption('예약중');
    await page.getByRole('button', { name: '수정 저장' }).click();

    await page.waitForURL(/\/items\/\d+/);
    await expect(page.getByRole('heading', { name: newTitle })).toBeVisible();
    await expect(page.getByText('예약중')).toBeVisible();
    cleanupTitle = newTitle;
  } finally {
    if (cleanupTitle) {
      await deleteOwnedItemByTitle(page, cleanupTitle);
    }
  }
});

test('owner can delete item from my-items page', async ({ page }) => {
  let title: string | undefined;
  try {
    await signupViaUi(page);

    await page.goto('/items/new');
    title = `E2E 삭제대상 ${Date.now()}`;
    await page.getByLabel('상품명').fill(title);
    await selectFirstRegion(page);
    await page.getByLabel('가격').fill('3000');
    await page.getByLabel('설명').fill('삭제 테스트용');
    await page.getByRole('button', { name: '등록하기' }).click();
    await page.waitForURL(/\/items\/\d+/);

    await page.goto('/my-items');
    await expect(page.getByRole('heading', { name: '내가 등록한 상품' })).toBeVisible();
    const itemCard = page.locator('.manage-card').filter({ hasText: title });
    await expect(itemCard).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await itemCard.getByRole('button', { name: '삭제' }).click();

    await expect(itemCard).not.toBeVisible();
    await expect(page.getByText('아직 등록한 상품이 없습니다')).toBeVisible();
  } finally {
    if (title) {
      await deleteOwnedItemByTitle(page, title);
    }
  }
});
