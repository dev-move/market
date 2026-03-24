import type { Metadata } from 'next';
import AuthRouteGuard from '@/components/auth-route-guard';
import SiteHeader from '@/components/site-header';
import './globals.css';

export const metadata: Metadata = {
  title: '중고거래',
  description: 'FastAPI + Next.js 중고거래 서비스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <main className="page-shell">
          <AuthRouteGuard>{children}</AuthRouteGuard>
        </main>
      </body>
    </html>
  );
}
