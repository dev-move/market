'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import {
  fetchMyReports,
  fetchMyReviews,
  type MyReportActivity,
  type MyReviewActivity,
} from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { getStatusLabel } from '@/lib/status';

function getReportStatusLabel(status: 'pending' | 'reviewing' | 'resolved' | 'unknown') {
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

export default function MyActivityPage() {
  const [reviews, setReviews] = useState<MyReviewActivity[]>([]);
  const [reports, setReports] = useState<MyReportActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.access_token) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }

    Promise.all([
      fetchMyReviews(session.access_token),
      fetchMyReports(session.access_token),
    ])
      .then(([reviewRows, reportRows]) => {
        setReviews(reviewRows);
        setReports(reportRows);
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : '내 활동을 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (needsLogin) {
    return (
      <div className="container section basic-screen">
        <div className="panel basic-card">
          <h1>로그인이 필요합니다.</h1>
          <p className="muted" style={{ marginTop: 12 }}>
            내가 남긴 후기와 신고 내역을 확인하려면 먼저 로그인해주세요.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 20 }}>
            <Link href="/login" className="button">
              로그인
            </Link>
            <Link href="/items" className="ghost-button">
              상품 보기
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
          <h1>내 활동</h1>
          <p className="muted">내가 남긴 후기와 신고 내역을 한곳에서 확인할 수 있습니다.</p>
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <p className="muted">내 활동을 불러오는 중입니다.</p>
        </div>
      ) : error ? (
        <NoticeMessage tone="error" panel title="내 활동을 불러오지 못했습니다.">
          {error}
        </NoticeMessage>
      ) : (
        <div className="activity-grid">
          <section className="panel">
            <div className="row">
              <h2>내가 남긴 후기</h2>
              <span className="muted">{reviews.length}건</span>
            </div>

            {reviews.length > 0 ? (
              <div className="activity-list">
                {reviews.map((review) => (
                  <Link key={review.id} href={`/items/${review.itemId}`} className="activity-card">
                    <div
                      className="activity-thumb"
                      style={{ backgroundImage: `url(${review.itemImageUrl})` }}
                    />
                    <div className="activity-body">
                      <div className="row">
                        <strong>{review.itemTitle}</strong>
                        <span className={`badge badge-${review.itemStatus}`}>
                          {getStatusLabel(review.itemStatus)}
                        </span>
                      </div>
                      <p style={{ marginTop: 8 }}>{'★'.repeat(review.score)}</p>
                      <p className="muted" style={{ marginTop: 8 }}>
                        {review.comment ?? '남긴 후기 내용이 없습니다.'}
                      </p>
                      <p className="muted" style={{ marginTop: 8 }}>
                        {review.createdAt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="feedback-hint">
                <p className="muted">아직 남긴 후기가 없습니다.</p>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="row">
              <h2>내가 접수한 신고</h2>
              <span className="muted">{reports.length}건</span>
            </div>

            {reports.length > 0 ? (
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
                        처리 상태: {getReportStatusLabel(report.reportStatus)}
                        {report.reviewedAt ? ` · ${report.reviewedAt}` : ''}
                      </p>
                      <p className="muted" style={{ marginTop: 8 }}>
                        {report.detail ?? '추가 상세 내용은 없습니다.'}
                      </p>
                      {report.adminNote ? (
                        <p className="muted" style={{ marginTop: 8 }}>
                          운영 메모: {report.adminNote}
                        </p>
                      ) : null}
                      <p className="muted" style={{ marginTop: 8 }}>
                        {report.createdAt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="feedback-hint">
                <p className="muted">아직 접수한 신고가 없습니다.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
