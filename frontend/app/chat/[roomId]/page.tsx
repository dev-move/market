'use client';

import { useEffect, useRef, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import { createChatWebSocket, fetchChatMessages, fetchMyChatRooms } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { getStatusLabel } from '@/lib/status';
import type { ChatMessage, ChatRoom } from '@/lib/mock-data';

type Props = {
  params: {
    roomId: string;
  };
};

export default function ChatRoomPage({ params }: Props) {
  const roomId = Number(params.roomId);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    let isActive = true;

    async function loadChatRoom() {
      try {
        const [rooms, nextMessages] = await Promise.all([
          fetchMyChatRooms(session?.access_token, session?.user.id),
          fetchChatMessages(roomId, session?.access_token, session?.user.id),
        ]);
        if (!isActive) {
          return;
        }

        const target = rooms.find((entry) => entry.id === roomId);
        if (!target) {
          setRoom(null);
          setMessages([]);
          setLoadError('접근 가능한 채팅방을 찾을 수 없습니다.');
          return;
        }

        setRoom(target);
        setMessages(nextMessages);
        setLoadError('');
      } catch (caughtError) {
        if (!isActive) {
          return;
        }
        setRoom(null);
        setMessages([]);
        setLoadError(caughtError instanceof Error ? caughtError.message : '채팅방을 불러오지 못했습니다.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadChatRoom();

    return () => {
      isActive = false;
    };
  }, [roomId]);

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.access_token || !session.user?.id || !room) {
      return undefined;
    }

    const socket = createChatWebSocket(roomId, session.access_token);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setIsSocketConnected(true);
      setSendError('');
    });

    socket.addEventListener('close', () => {
      setIsSocketConnected(false);
    });

    socket.addEventListener('error', () => {
      setSendError('실시간 채팅 연결에 실패했습니다.');
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          id?: number;
          room_id?: number;
          sender_id?: number;
          sender_nickname?: string;
          message?: string;
          created_at?: string | null;
        };

        if (payload.type !== 'message' || !payload.id || payload.room_id !== roomId) {
          return;
        }

        const messageId = payload.id;
        const messageRoomId = payload.room_id;

        setMessages((current) => {
          if (current.some((message) => message.id === messageId)) {
            return current;
          }

          return [
            ...current,
            {
              id: messageId,
              roomId: messageRoomId,
              sender: payload.sender_nickname ?? '알 수 없음',
              mine: payload.sender_id === session.user.id,
              message: payload.message ?? '',
              createdAt: payload.created_at
                ? new Date(payload.created_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '방금 전',
            },
          ];
        });

        setRoom((current) =>
          current
            ? {
                ...current,
                lastMessage: payload.message ?? current.lastMessage,
                updatedAt: payload.created_at
                  ? new Date(payload.created_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '방금 전',
              }
            : current,
        );
      } catch {
        setSendError('메시지 수신 중 오류가 발생했습니다.');
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [room, roomId]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = draft.trim();
    if (!value) {
      return;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setSendError('실시간 연결이 아직 준비되지 않았습니다.');
      return;
    }

    socketRef.current.send(JSON.stringify({ message: value }));
    setDraft('');
    setSendError('');
  }

  if (loading) {
    return (
      <div className="container section basic-screen">
        <div className="panel basic-card">
          <p className="muted">채팅방을 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container section basic-screen">
        <NoticeMessage tone="error" panel className="basic-card" title="채팅방을 불러오지 못했습니다.">
          {loadError}
        </NoticeMessage>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container section basic-screen">
        <div className="panel basic-card">
          <h1>채팅방을 찾을 수 없습니다.</h1>
          <p className="muted" style={{ marginTop: 12 }}>
            로그인 상태 또는 채팅방 정보가 없어서 화면을 표시할 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="chat-layout">
        <aside className="panel">
          <h2>대화 정보</h2>
          <div className="stack" style={{ marginTop: 16 }}>
            <div
              className="chat-room-thumb chat-room-thumb-large"
              style={{
                backgroundImage: `url(${room.itemImageUrl ?? ''})`,
              }}
            />
            <div>
              <p className="muted">거래 상품</p>
              <strong>{room.itemTitle ?? `상품 #${room.itemId}`}</strong>
            </div>
            <div>
              <p className="muted">거래 상태</p>
              <strong>
                <span className={`badge badge-${room.itemStatus ?? 'selling'}`}>
                  {getStatusLabel(room.itemStatus ?? 'selling')}
                </span>
              </strong>
            </div>
            <div>
              <p className="muted">상대방</p>
              <strong>{room.partner}</strong>
            </div>
            <div>
              <p className="muted">마지막 활동</p>
              <strong>{room.updatedAt}</strong>
            </div>
          </div>
        </aside>

        <section className="panel">
          <div className="section-header">
            <div>
              <h1>{room.partner}님과의 채팅</h1>
              <p className="muted">
                {room.itemTitle ?? `상품 #${room.itemId}`}
              </p>
            </div>
            <p className="muted">
              {isSocketConnected ? '실시간 연결됨' : '이전 메시지 조회 중'}
            </p>
          </div>

          <div className="messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-row${message.mine ? ' mine' : ''}`}
              >
                <div className="message-bubble">
                  <strong>{message.sender}</strong>
                  <p style={{ marginTop: 6 }}>{message.message}</p>
                  <p className="muted" style={{ marginTop: 8 }}>
                    {message.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form className="form" style={{ marginTop: 20 }} onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="message">메시지 입력</label>
              <textarea
                id="message"
                name="message"
                placeholder="상대방에게 보낼 메시지를 입력하세요."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
            {sendError ? (
              <NoticeMessage tone="error">
                {sendError}
              </NoticeMessage>
            ) : null}
            <button type="submit" className="button">
              전송
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
