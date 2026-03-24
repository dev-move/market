'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import { createChatRoom } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

type Props = {
  itemId: number;
};

export default function StartChatButton({ itemId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    const session = getAuthSession();
    if (!session?.access_token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const room = await createChatRoom(itemId, session.access_token, session.user.id);
      router.push(`/chat/${room.id}`);
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message || '채팅방 생성에 실패했습니다.');
      } else {
        setError('채팅방 생성에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" className="button" onClick={handleClick} disabled={loading}>
        {loading ? '채팅방 생성 중...' : '판매자와 채팅'}
      </button>
      {error ? (
        <NoticeMessage tone="error">
          {error}
        </NoticeMessage>
      ) : null}
    </div>
  );
}
