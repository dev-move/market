'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import NoticeMessage from '@/components/notice-message';
import {
  createReport,
  createReview,
  fetchItemReviews,
  type ReviewSummary,
} from '@/lib/api';
import { getAuthSession, subscribeAuthSession } from '@/lib/auth';

type Props = {
  itemId: number;
  ownerId: number;
  itemStatus: 'selling' | 'reserved' | 'sold';
};

const reportReasons = [
  '사기 의심',
  '부적절한 상품',
  '허위 정보',
  '욕설/비매너',
];

export default function ItemFeedbackPanel({ itemId, ownerId, itemStatus }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [reviewScore, setReviewScore] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [reportReason, setReportReason] = useState(reportReasons[0]);
  const [reportDetail, setReportDetail] = useState('');
  const [message, setMessage] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [hasSubmittedReport, setHasSubmittedReport] = useState(false);
  const isOwner = currentUserId === ownerId;
  const isLoggedIn = currentUserId !== null;
  const canReport = isLoggedIn && !isOwner && !hasSubmittedReport;
  const averageScore =
    reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.score, 0) / reviews.length).toFixed(1) : null;

  useEffect(() => {
    fetchItemReviews(itemId).then(setReviews);
  }, [itemId]);

  useEffect(() => {
    const syncSession = () => {
      setCurrentUserId(getAuthSession()?.user.id ?? null);
    };

    syncSession();
    return subscribeAuthSession(syncSession);
  }, []);

  async function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getAuthSession();
    if (!session?.access_token) {
      router.push('/login');
      return;
    }

    setSubmittingReview(true);
    setMessage('');
    try {
      const review = await createReview(
        itemId,
        { score: Number(reviewScore), comment: reviewComment },
        session.access_token,
      );
      setReviews((current) => [
        {
          id: review.id,
          score: review.score,
          comment: review.comment ?? null,
          createdAt: '방금 전',
        },
        ...current,
      ]);
      setHasSubmittedReview(true);
      setReviewComment('');
      setMessage('후기가 등록되었습니다.');
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : '후기 등록에 실패했습니다.');
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleReportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getAuthSession();
    if (!session?.access_token) {
      router.push('/login');
      return;
    }

    setSubmittingReport(true);
    setMessage('');
    try {
      await createReport(
        itemId,
        { reason: reportReason, detail: reportDetail },
        session.access_token,
      );
      setHasSubmittedReport(true);
      setReportDetail('');
      setMessage('신고가 접수되었습니다.');
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : '신고 접수에 실패했습니다.');
    } finally {
      setSubmittingReport(false);
    }
  }

  return (
    <div className="detail-feedback-grid">
      <section className="panel">
        <h2>거래 후기</h2>
        <div className="feedback-summary">
          <strong>{averageScore ? `평균 ${averageScore} / 5` : '아직 평점이 없습니다.'}</strong>
          <span className="muted">후기 {reviews.length}개</span>
        </div>
        <div className="stack" style={{ marginTop: 16 }}>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="feedback-card">
                <div className="row">
                  <strong>{'★'.repeat(review.score)}</strong>
                  <span className="muted">{review.createdAt}</span>
                </div>
                <p style={{ marginTop: 8 }}>{review.comment ?? '후기 내용이 없습니다.'}</p>
              </div>
            ))
          ) : (
            <p className="muted">아직 등록된 후기가 없습니다.</p>
          )}
        </div>

        {!isLoggedIn ? (
          <div className="feedback-hint">
            <p className="muted">후기와 신고 기능은 로그인 후 이용할 수 있습니다.</p>
          </div>
        ) : isOwner ? (
          <div className="feedback-hint">
            <p className="muted">내가 등록한 상품이라 후기를 작성하거나 신고할 수 없습니다.</p>
          </div>
        ) : itemStatus !== 'sold' ? (
          <div className="feedback-hint">
            <p className="muted">후기는 판매 완료된 상품에서만 작성할 수 있습니다.</p>
          </div>
        ) : hasSubmittedReview ? (
          <div className="feedback-hint">
            <p className="muted">이 상품에는 이미 후기를 남겼습니다.</p>
          </div>
        ) : (
          <form className="form" style={{ marginTop: 20 }} onSubmit={handleReviewSubmit}>
            <div className="field">
              <label htmlFor="reviewScore">평점</label>
              <select
                id="reviewScore"
                value={reviewScore}
                onChange={(event) => setReviewScore(event.target.value)}
              >
                <option value="5">5점</option>
                <option value="4">4점</option>
                <option value="3">3점</option>
                <option value="2">2점</option>
                <option value="1">1점</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="reviewComment">후기 내용</label>
              <textarea
                id="reviewComment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="거래 경험을 남겨주세요."
              />
            </div>
            <button type="submit" className="button" disabled={submittingReview}>
              {submittingReview ? '등록 중...' : '후기 등록'}
            </button>
          </form>
        )}
      </section>

      <section className="panel">
        <h2>상품 신고</h2>
        <p className="muted" style={{ marginTop: 12 }}>
          부적절한 상품이거나 문제가 있다면 신고할 수 있습니다.
        </p>
        {!isLoggedIn ? (
          <div className="feedback-hint">
            <p className="muted">로그인 후 신고를 접수할 수 있습니다.</p>
          </div>
        ) : isOwner ? (
          <div className="feedback-hint">
            <p className="muted">내가 등록한 상품은 신고할 수 없습니다.</p>
          </div>
        ) : hasSubmittedReport ? (
          <div className="feedback-hint">
            <p className="muted">신고가 접수되었습니다. 운영 검토를 기다려주세요.</p>
          </div>
        ) : (
          <form className="form" style={{ marginTop: 20 }} onSubmit={handleReportSubmit}>
            <div className="field">
              <label htmlFor="reportReason">신고 사유</label>
              <select
                id="reportReason"
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
              >
                {reportReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="reportDetail">상세 내용</label>
              <textarea
                id="reportDetail"
                value={reportDetail}
                onChange={(event) => setReportDetail(event.target.value)}
                placeholder="신고 상세 내용을 남겨주세요."
              />
            </div>
            <button type="submit" className="button danger-button" disabled={submittingReport || !canReport}>
              {submittingReport ? '신고 중...' : '신고 접수'}
            </button>
          </form>
        )}
      </section>

      {message ? (
        <NoticeMessage
          tone={message.includes('실패') || message.includes('없습니다') ? 'error' : 'success'}
          panel
          className="detail-feedback-message"
        >
          {message}
        </NoticeMessage>
      ) : null}
    </div>
  );
}
