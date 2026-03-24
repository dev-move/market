'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import NoticeMessage from '@/components/notice-message';
import {
  deleteItemImage,
  fetchCategories,
  fetchProduct,
  fetchRegions,
  updateItem,
  uploadItemImages,
  type ApiRegion,
} from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

type Props = {
  params: {
    itemId: string;
  };
};

type CategoryOption = {
  id: number;
  name: string;
  children: CategoryOption[];
};

const statusOptions = [
  { value: 'selling', label: '판매중' },
  { value: 'reserved', label: '예약중' },
  { value: 'sold', label: '판매완료' },
] as const;

export default function EditItemPage({ params }: Props) {
  const router = useRouter();
  const itemId = Number(params.itemId);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [regions, setRegions] = useState<ApiRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'selling' | 'reserved' | 'sold'>('selling');
  const [existingImages, setExistingImages] = useState<Array<{ id: number; imageUrl: string }>>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchCategories(), fetchRegions(), fetchProduct(itemId)])
      .then(([categoryRows, regionRows, product]) => {
        if (!isMounted || !product) {
          setLoading(false);
          return;
        }

        setCategories(categoryRows as CategoryOption[]);
        setRegions(regionRows);
        setTitle(product.title);
        setPrice(String(product.price));
        setDescription(product.description);
        setStatus(product.status);
        setExistingImages(product.imageEntries ?? []);

        const selectedRegion = regionRows.find((region) => region.name === product.region);
        if (selectedRegion) {
          setRegionId(String(selectedRegion.id));
        }

        const selectedCategory = categoryRows
          .flatMap((category) => [
            { id: category.id, name: category.name },
            ...category.children.map((child) => ({ id: child.id, name: child.name })),
          ])
          .find((category) => category.name === product.category);
        if (selectedCategory) {
          setCategoryId(String(selectedCategory.id));
        }

        setLoading(false);
      })
      .catch((caughtError) => {
        if (!isMounted) {
          return;
        }
        setMessage(caughtError instanceof Error ? caughtError.message : '상품 정보를 불러오지 못했습니다.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [itemId]);

  const flatCategories = categories.flatMap((category) => [
    { id: category.id, label: category.name },
    ...category.children.map((child) => ({
      id: child.id,
      label: `${category.name} / ${child.name}`,
    })),
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const session = getAuthSession();
    if (!session?.access_token) {
      router.push('/login');
      return;
    }

    if (!regionId) {
      setMessage('거래 지역을 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await updateItem(
        itemId,
        {
          title,
          category_id: categoryId ? Number(categoryId) : null,
          region_id: Number(regionId),
          price: Number(price),
          description,
          status,
        },
        session.access_token,
      );
      if (selectedImages.length > 0) {
        await uploadItemImages(itemId, selectedImages, session.access_token);
      }
      setMessage('상품 정보가 수정되었습니다. 상세 페이지로 이동합니다.');
      setTimeout(() => {
        router.push(`/items/${itemId}`);
        router.refresh();
      }, 600);
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setMessage(caughtError.message || '상품 수정에 실패했습니다.');
      } else {
        setMessage('상품 수정에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteImage(imageId: number) {
    const session = getAuthSession();
    if (!session?.access_token) {
      router.push('/login');
      return;
    }

    setDeletingImageId(imageId);
    setMessage('');
    try {
      await deleteItemImage(itemId, imageId, session.access_token);
      setExistingImages((current) => current.filter((image) => image.id !== imageId));
      setMessage('이미지가 삭제되었습니다.');
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setMessage(caughtError.message || '이미지 삭제에 실패했습니다.');
      } else {
        setMessage('이미지 삭제에 실패했습니다.');
      }
    } finally {
      setDeletingImageId(null);
    }
  }

  if (loading) {
    return (
      <div className="container section">
        <div className="panel">
          <p className="muted">상품 정보를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="panel" style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1>상품 수정</h1>
        <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
          등록된 상품의 정보와 거래 상태를 수정할 수 있습니다.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">상품명</label>
            <input
              id="title"
              name="title"
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
          </div>

          <div className="field">
            <label htmlFor="status">거래 상태</label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as 'selling' | 'reserved' | 'sold')}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="price">가격</label>
            <input
              id="price"
              name="price"
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="description">설명</label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="field">
            <label>현재 상품 이미지</label>
            {existingImages.length > 0 ? (
              <div className="edit-image-grid">
                {existingImages.map((image) => (
                  <div key={image.id} className="edit-image-card">
                    <div
                      className="edit-image-thumb"
                      style={{ backgroundImage: `url(${image.imageUrl})` }}
                    />
                    <button
                      type="button"
                      className="button danger-button"
                      onClick={() => void handleDeleteImage(image.id)}
                      disabled={deletingImageId === image.id}
                    >
                      {deletingImageId === image.id ? '삭제 중...' : '이미지 삭제'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">등록된 이미지가 없습니다.</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="newImages">이미지 추가 업로드</label>
            <input
              id="newImages"
              name="newImages"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setSelectedImages(Array.from(event.target.files ?? []))}
            />
            <p className="muted">
              {selectedImages.length > 0
                ? `${selectedImages.length}개의 새 이미지를 저장할 준비가 되었습니다.`
                : '새 이미지를 선택하면 저장 시 함께 업로드됩니다.'}
            </p>
          </div>

          {message ? (
            <NoticeMessage tone={message.includes('실패') || message.includes('못했습니다') ? 'error' : 'success'}>
              {message}
            </NoticeMessage>
          ) : null}

          <div className="hero-actions">
            <button type="submit" className="button">
              {submitting ? '저장 중...' : '수정 저장'}
            </button>
            <Link href={`/items/${itemId}`} className="ghost-button">
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
