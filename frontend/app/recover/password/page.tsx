'use client';

import Link from 'next/link';
import { useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import { recoverPassword } from '@/lib/api';

export default function RecoverPasswordPage() {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== newPasswordConfirm) {
      setError('새 비밀번호와 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      await recoverPassword({
        username: username.trim().toLowerCase(),
        full_name: fullName.trim(),
        email: email.trim(),
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setSuccess('비밀번호가 변경되었습니다. 로그인해 주세요.');
      setNewPassword('');
      setNewPasswordConfirm('');
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
        <h1>비밀번호 찾기</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
          가입 시 입력한 아이디, 이름, 이메일이 일치하면 새 비밀번호로 변경할 수 있습니다.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
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
            <label htmlFor="newPassword">새 비밀번호</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="newPasswordConfirm">새 비밀번호 확인</label>
            <input
              id="newPasswordConfirm"
              name="newPasswordConfirm"
              type="password"
              autoComplete="new-password"
              value={newPasswordConfirm}
              onChange={(event) => setNewPasswordConfirm(event.target.value)}
            />
          </div>

          {error ? <NoticeMessage tone="error">{error}</NoticeMessage> : null}
          {success ? <NoticeMessage tone="success">{success}</NoticeMessage> : null}

          <button type="submit" className="button" disabled={loading}>
            {loading ? '처리 중...' : '비밀번호 변경'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 20 }}>
          <Link href="/login">로그인</Link>
          {' · '}
          <Link href="/recover/username">아이디 찾기</Link>
        </p>
      </div>
    </div>
  );
}
