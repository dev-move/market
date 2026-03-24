import Link from 'next/link';

import NoticeMessage from '@/components/notice-message';
import ProductCard from '@/components/product-card';
import { fetchProducts } from '@/lib/api';

export default async function Home() {
  let products = [];
  let error = '';

  try {
    products = await fetchProducts();
  } catch (caughtError) {
    error = caughtError instanceof Error ? caughtError.message : '상품을 불러오지 못했습니다.';
  }

  return (
    <div className="container section">
      <section className="hero">
        <h1>동네 기반 중고거래 서비스</h1>
        <p>
          FastAPI 백엔드와 Next.js 프론트엔드로 구성한 중고거래 프로젝트입니다.
          홈, 상품 상세, 상품 등록, 채팅, 로그인, 회원가입 화면을 포함한 기본
          UI를 제공합니다.
        </p>
        <form action="/items" method="get" className="search-form search-form-hero">
          <input type="search" name="q" placeholder="찾고 싶은 상품을 검색해보세요" />
          <button type="submit" className="button">
            검색
          </button>
        </form>
        <div className="hero-actions">
          <Link href="/items" className="ghost-button">
            상품 둘러보기
          </Link>
          <Link href="/items/new" className="button">
            상품 등록하기
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>최근 등록 상품</h2>
          <Link href="/items" className="muted">
            전체 보기
          </Link>
        </div>
        {error ? (
          <NoticeMessage tone="error" panel title="상품을 불러오지 못했습니다.">
            {error}
          </NoticeMessage>
        ) : (
          <div className="grid product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* <section className="basic-screen">
        <div className="panel basic-card">
          <h2>기본 화면</h2>
          <p className="muted" style={{ marginTop: 12 }}>
            API 서버 문서는 <a href="http://localhost:8000/docs">/docs</a>에서,
            상태 확인은 <a href="http://localhost:8000/health">/health</a>에서 볼 수
            있습니다.
          </p>
        </div>
      </section> */}
    </div>
  );
}
