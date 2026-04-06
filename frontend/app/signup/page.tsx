'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import { fetchRegions, login, signup, type ApiRegion } from '@/lib/api';
import { saveAuthSession } from '@/lib/auth';

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'ko'));
}

export default function SignupPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<ApiRegion[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [regionCity, setRegionCity] = useState('');
  const [regionDistrict, setRegionDistrict] = useState('');
  const [regionId, setRegionId] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const cities = useMemo(
    () => uniqueSorted(regions.map((r) => r.city)),
    [regions],
  );

  const districtsForCity = useMemo(() => {
    if (!regionCity) {
      return [];
    }
    return uniqueSorted(
      regions.filter((r) => r.city === regionCity).map((r) => r.district),
    );
  }, [regions, regionCity]);

  const dongsForDistrict = useMemo(() => {
    if (!regionCity || !regionDistrict) {
      return [] as ApiRegion[];
    }
    return regions
      .filter((r) => r.city === regionCity && r.district === regionDistrict)
      .slice()
      .sort((a, b) => a.dong.localeCompare(b.dong, 'ko'));
  }, [regions, regionCity, regionDistrict]);

  useEffect(() => {
    fetchRegions()
      .then(setRegions)
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : '동네 목록을 불러오지 못했습니다.');
      });
  }, []);

  useEffect(() => {
    setRegionDistrict('');
    setRegionId('');
  }, [regionCity]);

  useEffect(() => {
    setRegionId('');
  }, [regionDistrict]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!regionCity || !regionDistrict || !regionId) {
      setError('대표 동네(시·도, 구, 읍·면·동)를 모두 선택해주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      if (passwordConfirm.length === 0) {
        setError('비밀번호 확인을 입력해주세요.');
      }
      return;
    }

    setLoading(true);

    try {
      await signup({
        username: username.trim(),
        password,
        password_confirm: passwordConfirm,
        email,
        nickname,
        full_name: fullName.trim(),
        region_id: Number(regionId),
      });

      const session = await login({ username: username.trim().toLowerCase(), password });
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
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="영문, 숫자, 4~20자"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="passwordConfirm">비밀번호 확인</label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호 다시 입력"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              aria-invalid={
                passwordConfirm.length > 0 && password !== passwordConfirm ? true : undefined
              }
              aria-describedby={
                passwordConfirm.length > 0 && password !== passwordConfirm
                  ? 'passwordConfirm-error'
                  : undefined
              }
            />
            {passwordConfirm.length > 0 && password !== passwordConfirm ? (
              <p id="passwordConfirm-error" className="field-error-text" role="alert">
                비밀번호가 다릅니다
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
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
              autoComplete="nickname"
              placeholder="닉네임 입력"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </div>

          <div className="field">
            <span className="field-label-text" id="region-group-label">
              대표 동네
            </span>
            <div className="region-cascade" role="group" aria-labelledby="region-group-label">
              <div className="field">
                <label htmlFor="regionCity">시·도</label>
                <select
                  id="regionCity"
                  name="regionCity"
                  value={regionCity}
                  onChange={(event) => setRegionCity(event.target.value)}
                >
                  <option value="">시·도 선택</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="regionDistrict">구</label>
                <select
                  id="regionDistrict"
                  name="regionDistrict"
                  value={regionDistrict}
                  onChange={(event) => setRegionDistrict(event.target.value)}
                  disabled={!regionCity}
                >
                  <option value="">{regionCity ? '구 선택' : '시·도를 먼저 선택'}</option>
                  {districtsForCity.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="regionDong">읍·면·동</label>
                <select
                  id="regionDong"
                  name="regionDong"
                  value={regionId}
                  onChange={(event) => setRegionId(event.target.value)}
                  disabled={!regionDistrict}
                >
                  <option value="">
                    {regionDistrict ? '읍·면·동 선택' : '구를 먼저 선택'}
                  </option>
                  {dongsForDistrict.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.dong}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="muted">
              {regions.length > 0
                ? '가입 후 대표 동네를 기준으로 상품과 채팅이 연결됩니다. 동 목록은 서버 DB에 등록된 지역입니다.'
                : '등록된 지역이 없으면 회원가입이 제한될 수 있습니다.'}
            </p>
          </div>

          <div className="field">
            <label htmlFor="fullName">이름</label>
            <input
              id="fullName"
              name="fullName"
              autoComplete="name"
              placeholder="실명"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
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
