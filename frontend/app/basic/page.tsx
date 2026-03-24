import Link from 'next/link';

export default function BasicPage() {
  return (
    <div className="container section basic-screen">
      <div className="panel basic-card">
        <h1>기본 화면</h1>
        <p className="muted" style={{ marginTop: 12 }}>
          서비스의 기본 안내 화면입니다. 상단 메뉴를 통해 상품, 채팅, 로그인,
          회원가입 화면으로 이동할 수 있습니다.
        </p>
        <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
          <Link href="/" className="button">
            홈으로 이동
          </Link>
          <Link href="/items" className="ghost-button">
            상품 리스트 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
