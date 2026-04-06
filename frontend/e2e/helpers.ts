import { expect, type Page } from '@playwright/test';

type SignupOptions = {
  username?: string;
  email?: string;
  nickname?: string;
  fullName?: string;
  password?: string;
};

export async function signupViaUi(page: Page, options: SignupOptions = {}) {
  const stamp = Date.now();
  const username = options.username ?? `pwuser${stamp.toString().slice(-8)}`;
  const email = options.email ?? `playwright_${stamp}@example.com`;
  const nickname = options.nickname ?? `pw${stamp.toString().slice(-8)}`;
  const fullName = options.fullName ?? '플레이wright';
  const password = options.password ?? 'password123';

  await page.goto('/signup');
  await page.getByLabel('아이디').fill(username);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByLabel('비밀번호 확인').fill(password);
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('닉네임').fill(nickname);

  const citySelect = page.getByLabel('시·도');
  await expect(citySelect).toBeVisible();
  await citySelect.selectOption({ label: '서울' });

  const districtSelect = page.getByLabel('구');
  await expect(districtSelect).toBeEnabled();
  await districtSelect.selectOption({ label: '강남구' });

  const dongSelect = page.getByLabel('읍·면·동');
  await expect(dongSelect).toBeEnabled();
  await dongSelect.selectOption({ label: '역삼동' });

  await page.getByLabel('이름').fill(fullName);
  await page.getByRole('button', { name: '회원가입' }).click();

  await page.waitForURL('**/');
  await expect(page.getByText(`${nickname}님`)).toBeVisible();

  return { username, email, nickname, fullName, password };
}

export async function loginViaUi(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('아이디').fill(username);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('**/');
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
}

export async function logoutViaStorage(page: Page) {
  await page.evaluate(() => localStorage.removeItem('market_auth_session'));
  await page.reload();
}

export async function selectFirstRegion(page: Page, label = '거래 지역') {
  const select = page.getByLabel(label);
  await expect(select).toBeVisible();
  await expect(select.locator('option').nth(1)).toBeAttached({ timeout: 10000 });
  const opts = await select.locator('option').evaluateAll((elements) =>
    elements.map((el) => (el as HTMLOptionElement).value).filter(Boolean),
  );
  if (opts.length === 0) throw new Error(`${label} 옵션이 없습니다.`);
  await select.selectOption(opts[0]);
}

/** 현재 로그인 사용자의 내 상품에서 제목이 일치하는 카드가 있으면 삭제합니다. */
export async function deleteOwnedItemByTitle(page: Page, title: string) {
  await page.goto('/my-items');
  const card = page.locator('.manage-card').filter({ hasText: title });
  if ((await card.count()) === 0) {
    return;
  }
  page.once('dialog', (dialog) => dialog.accept());
  await card.first().getByRole('button', { name: '삭제' }).click();
  await expect(card.first()).not.toBeVisible({ timeout: 15000 });
}
