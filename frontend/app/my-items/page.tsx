'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import NoticeMessage from '@/components/notice-message';
import { deleteItem, fetchMyItems } from '@/lib/api';
import { getStatusLabel } from '@/lib/status';
import { getAuthSession } from '@/lib/auth';
import type { Product } from '@/lib/mock-data';

export default function MyItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.access_token) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }

    fetchMyItems(session.access_token)
      .then(setItems)
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : '내 상품을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(itemId: number) {
    const session = getAuthSession();
    if (!session?.access_token) {
      router.push('/login');
      return;
    }

    const shouldDelete = window.confirm('이 상품을 삭제하시겠습니까?');
    if (!shouldDelete) {
      return;
    }

    setDeletingId(itemId);
    setError('');

    try {
      await deleteItem(itemId, session.access_token);
      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message || '상품 삭제에 실패했습니다.');
      } else {
        setError('상품 삭제에 실패했습니다.');
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (needsLogin) {
    return (
      <div className="container section basic-screen">
        <div className="panel basic-card">
          <h1>로그인이 필요합니다.</h1>
          <p className="muted" style={{ marginTop: 12 }}>
            내가 등록한 상품을 관리하려면 먼저 로그인해주세요.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 20 }}>
            <Link href="/login" className="button">
              로그인
            </Link>
            <Link href="/items" className="ghost-button">
              상품 보기
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
          <h1>내가 등록한 상품</h1>
          <p className="muted">등록한 상품을 확인하고 필요하면 바로 삭제할 수 있습니다.</p>
        </div>
        <Link href="/items/new" className="button">
          새 상품 등록
        </Link>
      </div>

      {error ? (
        <NoticeMessage tone="error" panel title="내 상품 처리 중 오류가 발생했습니다.">
          {error}
        </NoticeMessage>
      ) : null}

      {loading ? (
        <div className="panel">
          <p className="muted">내 상품을 불러오는 중입니다.</p>
        </div>
      ) : items.length > 0 ? (
        <div className="manage-list">
          {items.map((item) => (
            <div key={item.id} className="panel manage-card">
              <div
                className="manage-thumb"
                style={{ backgroundImage: `url(${item.imageUrl})` }}
              />
              <div className="manage-body">
                <div className="row">
                  <h2>{item.title}</h2>
                  <span className={`badge badge-${item.status}`}>{getStatusLabel(item.status)}</span>
                </div>
                <p className="muted" style={{ marginTop: 8 }}>
                  {item.region} · {item.category}
                </p>
                <p className="price">{item.price.toLocaleString()}원</p>
                <p className="muted">{item.createdAt}</p>
                <div className="hero-actions" style={{ marginTop: 16 }}>
                  <Link href={`/items/${item.id}/edit`} className="button">
                    수정
                  </Link>
                  <Link href={`/items/${item.id}`} className="ghost-button">
                    상세 보기
                  </Link>
                  <button
                    type="button"
                    className="button danger-button"
                    onClick={() => void handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel">
          <h2>아직 등록한 상품이 없습니다.</h2>
          <p className="muted" style={{ marginTop: 12 }}>
            첫 상품을 등록해 판매를 시작해보세요.
          </p>
          <div className="hero-actions" style={{ marginTop: 20 }}>
            <Link href="/items/new" className="button">
              상품 등록하기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
