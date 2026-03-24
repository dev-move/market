import NoticeMessage from '@/components/notice-message';
import ProductCard from '@/components/product-card';
import { fetchProducts } from '@/lib/api';

type Props = {
  searchParams?: {
    q?: string;
  };
};

export default async function ItemsPage({ searchParams }: Props) {
  const query = searchParams?.q?.trim() ?? '';
  let products = [];
  let error = '';

  try {
    products = await fetchProducts(query);
  } catch (caughtError) {
    error = caughtError instanceof Error ? caughtError.message : '상품 목록을 불러오지 못했습니다.';
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1>상품 리스트</h1>
          <p className="muted">
            {query ? `"${query}" 검색 결과입니다.` : '최신 등록 상품을 한눈에 확인할 수 있습니다.'}
          </p>
        </div>
      </div>

      <form action="/items" method="get" className="search-form" style={{ marginBottom: 20 }}>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="상품명, 설명, 카테고리로 검색"
        />
        <button type="submit" className="button">
          검색
        </button>
      </form>

      {error ? (
        <NoticeMessage tone="error" panel title="상품 목록을 불러오지 못했습니다.">
          {error}
        </NoticeMessage>
      ) : products.length > 0 ? (
        <div className="grid product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="panel">
          <h2>검색 결과가 없습니다.</h2>
          <p className="muted" style={{ marginTop: 12 }}>
            다른 검색어로 다시 시도해보세요.
          </p>
        </div>
      )}
    </div>
  );
}
