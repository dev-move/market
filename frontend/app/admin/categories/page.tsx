'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import {
  createCategory,
  fetchCategories,
  type ApiCategoryTree,
} from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

type CategoryOption = {
  id: number;
  label: string;
};

function flattenCategories(categories: ApiCategoryTree[], prefix = ''): CategoryOption[] {
  return categories.flatMap((category) => {
    const label = prefix ? `${prefix} / ${category.name}` : category.name;
    return [
      { id: category.id, label },
      ...flattenCategories(category.children, label),
    ];
  });
}

function CategoryTree({ categories }: { categories: ApiCategoryTree[] }) {
  return (
    <div className="admin-tree">
      {categories.map((category) => (
        <div key={category.id} className="admin-tree-node">
          <strong>{category.name}</strong>
          {category.children.length > 0 ? (
            <div className="admin-tree-children">
              <CategoryTree categories={category.children} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ApiCategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const session = getAuthSession();
    if (!session?.access_token) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }

    fetchCategories()
      .then((rows) => setCategories(rows as ApiCategoryTree[]))
      .catch((caughtError) => {
        setMessage(caughtError instanceof Error ? caughtError.message : '카테고리를 불러오지 못했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getAuthSession();
    if (!session?.access_token) {
      setNeedsLogin(true);
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      await createCategory(
        {
          name,
          parent_id: parentId ? Number(parentId) : null,
        },
        session.access_token,
      );
      const nextCategories = await fetchCategories();
      setCategories(nextCategories as ApiCategoryTree[]);
      setName('');
      setParentId('');
      setMessage('카테고리가 추가되었습니다.');
    } catch (caughtError) {
      setMessage(caughtError instanceof Error ? caughtError.message : '카테고리 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (needsLogin) {
    return (
      <div className="container section basic-screen">
        <div className="panel basic-card">
          <h1>로그인이 필요합니다.</h1>
          <p className="muted" style={{ marginTop: 12 }}>
            운영 카테고리 화면을 보려면 먼저 로그인해주세요.
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
          <h1>운영 카테고리 관리</h1>
          <p className="muted">현재 카테고리 트리를 확인하고 새 카테고리를 추가할 수 있습니다.</p>
        </div>
      </div>

      <div className="activity-grid">
        <section className="panel">
          <h2>카테고리 추가</h2>
          <form className="form" style={{ marginTop: 16 }} onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">카테고리명</label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 디지털/가전"
              />
            </div>
            <div className="field">
              <label htmlFor="parentId">상위 카테고리</label>
              <select
                id="parentId"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
              >
                <option value="">최상위 카테고리</option>
                {flatCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            {message ? (
              <NoticeMessage tone={message.includes('실패') || message.includes('못했습니다') ? 'error' : 'success'}>
                {message}
              </NoticeMessage>
            ) : null}
            <button type="submit" className="button" disabled={submitting}>
              {submitting ? '추가 중...' : '카테고리 추가'}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>현재 카테고리 트리</h2>
          {loading ? (
            <p className="muted" style={{ marginTop: 16 }}>
              카테고리를 불러오는 중입니다.
            </p>
          ) : categories.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <CategoryTree categories={categories} />
            </div>
          ) : (
            <div className="feedback-hint">
              <p className="muted">등록된 카테고리가 없습니다.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
