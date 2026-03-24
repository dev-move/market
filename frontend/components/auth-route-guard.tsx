'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { getAuthSession, subscribeAuthSession, type AuthSession } from '@/lib/auth';

const PROTECTED_PREFIXES = [
  '/items',
  '/my-items',
  '/my-activity',
  '/favorites',
  '/chat',
  '/admin',
  '/basic',
];

const GUEST_ONLY_PATHS = ['/login', '/signup'];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isGuestOnlyPath(pathname: string) {
  return GUEST_ONLY_PATHS.includes(pathname);
}

type Props = {
  children: React.ReactNode;
};

export default function AuthRouteGuard({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      setSession(getAuthSession());
      setReady(true);
    };

    syncSession();
    return subscribeAuthSession(syncSession);
  }, []);

  const needsAuth = useMemo(() => isProtectedPath(pathname), [pathname]);
  const guestOnly = useMemo(() => isGuestOnlyPath(pathname), [pathname]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (needsAuth && !session) {
      router.replace('/login');
      return;
    }

    if (guestOnly && session) {
      router.replace('/');
    }
  }, [guestOnly, needsAuth, pathname, ready, router, session]);

  if (!ready) {
    return (
      <div className="container section basic-screen">
        <div className="panel basic-card">
          <p className="muted">인증 상태를 확인하는 중입니다.</p>
        </div>
      </div>
    );
  }

  if ((needsAuth && !session) || (guestOnly && session)) {
    return (
      <div className="container section basic-screen">
        <div className="panel basic-card">
          <p className="muted">이동 중입니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
