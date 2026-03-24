'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import { fetchRegions, login, signup, type ApiRegion } from '@/lib/api';
import { saveAuthSession } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<ApiRegion[]>([]);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [regionId, setRegionId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRegions()
      .then(setRegions)
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : '동네 목록을 불러오지 못했습니다.');
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!regionId) {
      setError('대표 동네를 선택해주세요.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        email,
        nickname,
        password,
        region_id: regionId ? Number(regionId) : null,
      });

      const session = await login({ email, password });
      saveAuthSession(session);
      setSuccess('회원가입과 로그인이 완료되었습니다. 홈으로 이동합니다.');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 800);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : '회원가입에 실패했습니다. 입력값을 다시 확인해주세요.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section">
      <div className="panel" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1>회원가입</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
          동네 중고거래 서비스를 이용하기 위한 기본 회원가입 폼입니다.
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
            <label htmlFor="nickname">닉네임</label>
            <input
              id="nickname"
              name="nickname"
              placeholder="닉네임 입력"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="region">대표 동네</label>
            <select
              id="region"
              name="region"
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
            >
              <option value="">동네 선택</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <p className="muted">
              {regions.length > 0
                ? '가입 후 대표 동네를 기준으로 상품과 채팅이 연결됩니다.'
                : '등록된 지역이 없으면 회원가입이 제한될 수 있습니다.'}
            </p>
          </div>

          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="8자 이상"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? (
            <NoticeMessage tone="error">
              {error}
            </NoticeMessage>
          ) : null}
          {success ? (
            <NoticeMessage tone="success">
              {success}
            </NoticeMessage>
          ) : null}

          <button type="submit" className="button">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 20 }}>
          이미 계정이 있다면 <Link href="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
