'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import NoticeMessage from '@/components/notice-message';
import {
  createItem,
  fetchCategories,
  fetchRegions,
  uploadItemImages,
  type ApiRegion,
} from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

type CategoryOption = {
  id: number;
  name: string;
  children: CategoryOption[];
};

export default function NewItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [regions, setRegions] = useState<ApiRegion[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchRegions()])
      .then(([categoryRows, regionRows]) => {
        setCategories(categoryRows as CategoryOption[]);
        setRegions(regionRows);
      })
      .catch((caughtError) => {
        setMessage(caughtError instanceof Error ? caughtError.message : '기본 목록을 불러오지 못했습니다.');
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!regionId) {
      setMessage('거래 지역을 선택해주세요.');
      return;
    }

    const session = getAuthSession();
    if (!session?.access_token) {
      setMessage('상품 등록은 로그인 후 사용할 수 있습니다.');
      return;
    }

    setLoading(true);
    try {
      const createdItem = await createItem(
        {
          title,
          category_id: categoryId ? Number(categoryId) : null,
          region_id: Number(regionId),
          price: Number(price),
          description,
          status: 'selling',
        },
        session.access_token,
      );

      if (selectedImages.length > 0) {
        await uploadItemImages(createdItem.id, selectedImages, session.access_token);
      }

      setMessage('상품과 이미지가 등록되었습니다. 상세 페이지로 이동합니다.');
      setTitle('');
      setCategoryId('');
      setRegionId('');
      setPrice('');
      setDescription('');
      setSelectedImages([]);
      setTimeout(() => {
        router.push(`/items/${createdItem.id}`);
        router.refresh();
      }, 600);
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : '상품 또는 이미지 등록에 실패했습니다. 입력값과 로그인 상태를 확인해주세요.',
      );
    } finally {
      setLoading(false);
    }
  }

  const flatCategories = categories.flatMap((category) => [
    { id: category.id, label: category.name },
    ...category.children.map((child) => ({
      id: child.id,
      label: `${category.name} / ${child.name}`,
    })),
  ]);

  return (
    <div className="container section">
      <div className="panel" style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1>상품 등록</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
          상품 정보와 이미지를 입력해 등록 화면을 구성한 예시입니다.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">상품명</label>
            <input
              id="title"
              name="title"
              placeholder="예: 아이폰 13 128GB"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="category">카테고리</label>
            <select
              id="category"
              name="category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">카테고리 선택</option>
              {flatCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="region">거래 지역</label>
            <select
              id="region"
              name="region"
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
            >
              <option value="">거래 지역 선택</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <p className="muted">
              {regions.length > 0
                ? '상품을 올릴 동네를 선택하면 해당 지역 기준으로 노출됩니다.'
                : '등록된 지역 목록을 불러오지 못했습니다.'}
            </p>
          </div>

          <div className="field">
            <label htmlFor="price">가격</label>
            <input
              id="price"
              name="price"
              type="number"
              placeholder="500000"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea
              id="description"
              name="description"
              placeholder="상품 상태, 거래 방식 등을 자세히 적어주세요."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="images">상품 이미지</label>
            <input
              id="images"
              name="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setSelectedImages(Array.from(event.target.files ?? []))
              }
            />
            <p className="muted">
              {selectedImages.length > 0
                ? `${selectedImages.length}개의 이미지를 업로드합니다.`
                : '이미지를 올리지 않으면 Market 로고가 기본 썸네일로 표시됩니다.'}
            </p>
          </div>

          {message ? (
            <NoticeMessage tone={message.includes('실패') || message.includes('못했습니다') ? 'error' : 'success'}>
              {message}
            </NoticeMessage>
          ) : null}

          <button type="submit" className="button">
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
