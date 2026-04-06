'use client';

import Link from 'next/link';
import { useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import { recoverUsername } from '@/lib/api';

export default function RecoverUsernamePage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [foundUsername, setFoundUsername] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFoundUsername(null);
    setLoading(true);

    try {
      const { username } = await recoverUsername({
        email: email.trim(),
        full_name: fullName.trim(),
      });
      setFoundUsername(username);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : '일치하는 회원 정보를 찾을 수 없습니다.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section">
      <div className="panel" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>아이디 찾기</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
          가입 시 입력한 이메일과 이름을 입력해 주세요.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="fullName">이름</label>
            <input
              id="fullName"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          {error ? <NoticeMessage tone="error">{error}</NoticeMessage> : null}
          {foundUsername ? (
            <NoticeMessage tone="success">
              회원 아이디는 <strong>{foundUsername}</strong> 입니다.
            </NoticeMessage>
          ) : null}

          <button type="submit" className="button" disabled={loading}>
            {loading ? '확인 중...' : '아이디 확인'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 20 }}>
          <Link href="/login">로그인</Link>
          {' · '}
          <Link href="/recover/password">비밀번호 찾기</Link>
        </p>
      </div>
    </div>
  );
}
