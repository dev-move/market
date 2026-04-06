'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  clearAuthSession,
  getAuthSession,
  subscribeAuthSession,
  type AuthSession,
} from '@/lib/auth';

const publicLinks = [{ href: '/', label: '홈' }];

const privateLinks = [
  { href: '/items', label: '상품' },
  { href: '/items/new', label: '상품 등록' },
  { href: '/my-items', label: '내 상품' },
  { href: '/my-activity', label: '내 활동' },
  { href: '/admin/reports', label: '운영 신고' },
  { href: '/admin/categories', label: '운영 카테고리' },
  { href: '/favorites', label: '찜 목록' },
  { href: '/chat', label: '채팅' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const syncSession = () => setSession(getAuthSession());

    syncSession();
    const unsubscribe = subscribeAuthSession(syncSession);
    return unsubscribe;
  }, []);

  useEffect(() => {
    setSession(getAuthSession());
  }, [pathname]);

  function handleLogout() {
    clearAuthSession();
    setSession(null);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand brand-logo">
          <img src="/market-logo.png" alt="동네마켓" className="brand-logo-img" />
        </Link>
        <nav className="nav">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}

          {session ? (
            <>
              {privateLinks.map((link) => (
                <Link key={link.href} href={link.href} className="nav-link">
                  {link.label}
                </Link>
              ))}
              <span className="user-chip">{session.user.nickname}님</span>
              <button type="button" className="nav-action" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">
                로그인
              </Link>
              <Link href="/signup" className="nav-link">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
