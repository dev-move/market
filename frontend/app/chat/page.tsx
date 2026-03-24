'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import { fetchMyChatRooms } from '@/lib/api';
import { getStatusLabel } from '@/lib/status';
import { getAuthSession, subscribeAuthSession } from '@/lib/auth';
import type { ChatRoom } from '@/lib/mock-data';

const CHAT_LIST_POLL_MS = 5000;

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    async function loadRooms() {
      const session = getAuthSession();
      try {
        const nextRooms = await fetchMyChatRooms(session?.access_token, session?.user.id);
        if (!isActive) {
          return;
        }
        setRooms(nextRooms);
        setError('');
      } catch (caughtError) {
        if (!isActive) {
          return;
        }
        setError(caughtError instanceof Error ? caughtError.message : '채팅 목록을 불러오지 못했습니다.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    function restartPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }

      const session = getAuthSession();
      if (session?.access_token && session.user?.id) {
        pollTimer = setInterval(() => {
          void loadRooms();
        }, CHAT_LIST_POLL_MS);
      }
    }

    void loadRooms();
    restartPolling();

    const unsubscribe = subscribeAuthSession(() => {
      void loadRooms();
      restartPolling();
    });

    return () => {
      isActive = false;
      unsubscribe();
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, []);

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1>채팅 목록</h1>
          <p className="muted">구매자 또는 판매자로 참여 중인 대화를 확인합니다.</p>
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <p className="muted">채팅 목록을 불러오는 중입니다.</p>
        </div>
      ) : error ? (
        <NoticeMessage tone="error" panel title="채팅 목록을 불러오지 못했습니다.">
          {error}
        </NoticeMessage>
      ) : rooms.length > 0 ? (
        <div className="chat-list">
          {rooms.map((room) => (
            <Link key={room.id} href={`/chat/${room.id}`} className="card chat-room-card">
              <div className="chat-room-layout">
                <div
                  className="chat-room-thumb"
                  style={{
                    backgroundImage: `url(${room.itemImageUrl ?? ''})`,
                  }}
                />
                <div className="chat-room-body">
                  <div className="row">
                    <strong>{room.partner}</strong>
                    <span className="muted">{room.updatedAt}</span>
                  </div>
                  <div className="row" style={{ marginTop: 8 }}>
                    <p>{room.itemTitle ?? `상품 #${room.itemId}`}</p>
                    {room.itemStatus ? (
                      <span className={`badge badge-${room.itemStatus}`}>{getStatusLabel(room.itemStatus)}</span>
                    ) : null}
                  </div>
                  <p className="muted" style={{ marginTop: 8 }}>
                    {room.lastMessage}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel">
          <h2>아직 참여 중인 채팅이 없습니다.</h2>
          <p className="muted" style={{ marginTop: 12 }}>
            상품 상세에서 판매자와 채팅을 시작하면 이 목록에 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
