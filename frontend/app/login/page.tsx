'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import { login } from '@/lib/api';
import { saveAuthSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await login({ email, password });
      saveAuthSession(session);
      router.push('/');
      router.refresh();
    } catch {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section">
      <div className="panel" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>로그인</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
          이메일과 비밀번호로 로그인합니다.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? (
            <NoticeMessage tone="error">
              {error}
            </NoticeMessage>
          ) : null}

          <button type="submit" className="button">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 20 }}>
          아직 회원이 아니라면 <Link href="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
