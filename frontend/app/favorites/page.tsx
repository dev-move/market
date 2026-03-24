'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import ProductCard from '@/components/product-card';
import { fetchMyFavorites } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import type { Product } from '@/lib/mock-data';

export default function FavoritesPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.access_token) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }

    fetchMyFavorites(session.access_token)
      .then(setItems)
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : '찜 목록을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (needsLogin) {
    return (
      <div className="container section basic-screen">
        <div className="panel basic-card">
          <h1>로그인이 필요합니다.</h1>
          <p className="muted" style={{ marginTop: 12 }}>
            찜한 상품을 보려면 먼저 로그인해주세요.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 20 }}>
            <Link href="/login" className="button">
              로그인
            </Link>
            <Link href="/items" className="ghost-button">
              상품 보러가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1>내 찜 목록</h1>
          <p className="muted">관심 있는 상품을 한곳에서 다시 확인할 수 있습니다.</p>
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <p className="muted">찜한 상품을 불러오는 중입니다.</p>
        </div>
      ) : error ? (
        <NoticeMessage tone="error" panel title="찜 목록을 불러오지 못했습니다.">
          {error}
        </NoticeMessage>
      ) : items.length > 0 ? (
        <div className="grid product-grid">
          {items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      ) : (
        <div className="panel">
          <h2>아직 찜한 상품이 없습니다.</h2>
          <p className="muted" style={{ marginTop: 12 }}>
            상품 상세에서 찜하기를 누르면 이 목록에 추가됩니다.
          </p>
          <div className="hero-actions" style={{ marginTop: 20 }}>
            <Link href="/items" className="button">
              상품 둘러보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
