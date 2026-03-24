'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import { addFavorite, fetchMyFavorites, removeFavorite } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

type Props = {
  itemId: number;
};

export default function FavoriteButton({ itemId }: Props) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.access_token) {
      return;
    }

    fetchMyFavorites(session.access_token)
      .then((items) => {
        setIsFavorite(items.some((item) => item.id === itemId));
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : '찜 상태를 확인하지 못했습니다.');
      });
  }, [itemId]);

  async function handleClick() {
    const session = getAuthSession();
    if (!session?.access_token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isFavorite) {
        await removeFavorite(itemId, session.access_token);
        setIsFavorite(false);
      } else {
        await addFavorite(itemId, session.access_token);
        setIsFavorite(true);
      }
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message || '찜 처리에 실패했습니다.');
      } else {
        setError('찜 처리에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" className="ghost-button" onClick={handleClick} disabled={loading}>
        {loading ? '처리 중...' : isFavorite ? '찜 해제' : '찜하기'}
      </button>
      {error ? <NoticeMessage tone="error">{error}</NoticeMessage> : null}
    </div>
  );
}
