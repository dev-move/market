'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import {
  fetchAdminReports,
  updateAdminReport,
  type AdminReportActivity,
} from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { getStatusLabel } from '@/lib/status';

function getReportStatusLabel(status: AdminReportActivity['reportStatus']) {
  if (status === 'pending') {
    return '대기';
  }
  if (status === 'reviewing') {
    return '검토중';
  }
  if (status === 'resolved') {
    return '처리완료';
  }
  return '알 수 없음';
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReportActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState('');
  const [statusInputs, setStatusInputs] = useState<Record<number, 'pending' | 'reviewing' | 'resolved'>>({});
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.access_token) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }

    fetchAdminReports(session.access_token)
      .then((rows) => {
        setReports(rows);
        setStatusInputs(
          Object.fromEntries(
            rows.map((report) => [report.id, report.reportStatus === 'unknown' ? 'pending' : report.reportStatus]),
          ),
        );
        setNoteInputs(
          Object.fromEntries(
            rows.map((report) => [report.id, report.adminNote ?? '']),
          ),
        );
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : '신고 목록을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(reportId: number) {
    const session = getAuthSession();
    if (!session?.access_token) {
      setNeedsLogin(true);
      return;
    }

    setSavingId(reportId);
    setError('');
    try {
      const updated = await updateAdminReport(
        reportId,
        {
          status: statusInputs[reportId] ?? 'pending',
          admin_note: noteInputs[reportId] ?? '',
        },
        session.access_token,
      );

      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                reportStatus:
                  updated.status === 'pending' || updated.status === 'reviewing' || updated.status === 'resolved'
                    ? updated.status
                    : 'unknown',
                adminNote: updated.admin_note ?? null,
                reviewedAt: updated.reviewed_at ? new Date(updated.reviewed_at).toLocaleString('ko-KR') : null,
              }
            : report,
        ),
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '신고 상태 저장에 실패했습니다.');
    } finally {
      setSavingId(null);
    }
  }

  if (needsLogin) {
    return (
      <div className="container section basic-screen">
        <div className="panel basic-card">
          <h1>로그인이 필요합니다.</h1>
          <p className="muted" style={{ marginTop: 12 }}>
            운영 신고 목록을 보려면 먼저 로그인해주세요.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 20 }}>
            <Link href="/login" className="button">
              로그인
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1>운영 신고 목록</h1>
          <p className="muted">관리자 이메일로 등록된 계정만 전체 신고를 확인할 수 있습니다.</p>
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <p className="muted">신고 목록을 불러오는 중입니다.</p>
        </div>
      ) : error ? (
        <NoticeMessage tone="error" panel title="신고 목록을 불러오지 못했습니다.">
          {error}
        </NoticeMessage>
      ) : reports.length > 0 ? (
        <div className="activity-list">
          {reports.map((report) => (
            <Link key={report.id} href={`/items/${report.itemId}`} className="activity-card">
              <div
                className="activity-thumb"
                style={{ backgroundImage: `url(${report.itemImageUrl})` }}
              />
              <div className="activity-body">
                <div className="row">
                  <strong>{report.itemTitle}</strong>
                  <span className={`badge badge-${report.itemStatus}`}>
                    {getStatusLabel(report.itemStatus)}
                  </span>
                </div>
                <p style={{ marginTop: 8 }}>{report.reason}</p>
                <p className="muted" style={{ marginTop: 8 }}>
                  신고자: {report.reporterNickname} ({report.reporterEmail})
                </p>
                <p className="muted" style={{ marginTop: 8 }}>
                  처리 상태: {getReportStatusLabel(report.reportStatus)}
                  {report.reviewedAt ? ` · ${report.reviewedAt}` : ''}
                </p>
                <p className="muted" style={{ marginTop: 8 }}>
                  {report.detail ?? '상세 설명은 없습니다.'}
                </p>
                <div className="admin-report-controls">
                  <div className="field">
                    <label htmlFor={`status-${report.id}`}>처리 상태</label>
                    <select
                      id={`status-${report.id}`}
                      value={statusInputs[report.id] ?? 'pending'}
                      onChange={(event) =>
                        setStatusInputs((current) => ({
                          ...current,
                          [report.id]: event.target.value as 'pending' | 'reviewing' | 'resolved',
                        }))
                      }
                    >
                      <option value="pending">대기</option>
                      <option value="reviewing">검토중</option>
                      <option value="resolved">처리완료</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`note-${report.id}`}>운영 메모</label>
                    <textarea
                      id={`note-${report.id}`}
                      value={noteInputs[report.id] ?? ''}
                      onChange={(event) =>
                        setNoteInputs((current) => ({
                          ...current,
                          [report.id]: event.target.value,
                        }))
                      }
                      placeholder="처리 내용이나 판단 근거를 남겨주세요."
                    />
                  </div>
                  <div className="hero-actions">
                    <button
                      type="button"
                      className="button"
                      onClick={() => void handleSave(report.id)}
                      disabled={savingId === report.id}
                    >
                      {savingId === report.id ? '저장 중...' : '처리 상태 저장'}
                    </button>
                  </div>
                </div>
                <p className="muted" style={{ marginTop: 8 }}>
                  접수 시각: {report.createdAt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="panel">
          <h2>접수된 신고가 없습니다.</h2>
          <p className="muted" style={{ marginTop: 12 }}>
            새로운 신고가 접수되면 이 화면에서 전체 목록을 확인할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
