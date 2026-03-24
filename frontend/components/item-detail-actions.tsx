'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import FavoriteButton from '@/components/favorite-button';
import StartChatButton from '@/components/start-chat-button';
import { getAuthSession, subscribeAuthSession } from '@/lib/auth';

type Props = {
  itemId: number;
  ownerId: number;
};

export default function ItemDetailActions({ itemId, ownerId }: Props) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const syncSession = () => {
      setCurrentUserId(getAuthSession()?.user.id ?? null);
    };

    syncSession();
    return subscribeAuthSession(syncSession);
  }, []);

  const isOwner = currentUserId === ownerId;

  return (
    <div className="hero-actions" style={{ marginTop: 24 }}>
      {isOwner ? (
        <>
          <p className="muted action-note">
            내가 등록한 상품입니다. 이 화면에서 상품 정보와 상태를 수정할 수 있습니다.
          </p>
          <Link href={`/items/${itemId}/edit`} className="button">
            상품 수정
          </Link>
        </>
      ) : (
        <>
          <StartChatButton itemId={itemId} />
          <FavoriteButton itemId={itemId} />
        </>
      )}
      <Link href="/items" className="ghost-button">
        목록으로
      </Link>
    </div>
  );
}
