import { notFound } from 'next/navigation';

import ItemDetailActions from '@/components/item-detail-actions';
import ItemFeedbackPanel from '@/components/item-feedback-panel';
import ItemImageGallery from '@/components/item-image-gallery';
import NoticeMessage from '@/components/notice-message';
import { fetchProduct } from '@/lib/api';
import { getStatusLabel } from '@/lib/status';

type Props = {
  params: {
    itemId: string;
  };
};

export default async function ItemDetailPage({ params }: Props) {
  let product = null;
  let error = '';

  try {
    product = await fetchProduct(Number(params.itemId));
  } catch (caughtError) {
    error = caughtError instanceof Error ? caughtError.message : '상품 정보를 불러오지 못했습니다.';
  }

  if (error) {
    return (
      <div className="container section basic-screen">
        <NoticeMessage tone="error" panel className="basic-card" title="상품 정보를 불러오지 못했습니다.">
          {error}
        </NoticeMessage>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const detailImages =
    product.imageEntries?.map((image) => image.imageUrl).filter(Boolean) ?? [product.imageUrl];

  return (
    <div className="container section">
      <div className="detail-grid">
        <ItemImageGallery title={product.title} images={detailImages} />
        <div className="panel">
          <div className="row">
            <h1>{product.title}</h1>
            <span className={`badge badge-${product.status}`}>{getStatusLabel(product.status)}</span>
          </div>
          <p className="price">{product.price.toLocaleString()}원</p>
          <p>{product.description}</p>

          <div className="meta-list">
            <div className="row">
              <span className="muted">판매자</span>
              <strong>{product.seller}</strong>
            </div>
            <div className="row">
              <span className="muted">지역</span>
              <strong>{product.region}</strong>
            </div>
            <div className="row">
              <span className="muted">카테고리</span>
              <strong>{product.category}</strong>
            </div>
            <div className="row">
              <span className="muted">등록 시간</span>
              <strong>{product.createdAt}</strong>
            </div>
          </div>

          <ItemDetailActions
            itemId={product.id}
            ownerId={product.ownerId}
          />
        </div>
      </div>

      <ItemFeedbackPanel
        itemId={product.id}
        ownerId={product.ownerId}
        itemStatus={product.status}
      />
    </div>
  );
}
