# 🏘️ 동네마켓 (DongneMarket)

> 동네 리스트 기반 지역 중고거래 웹 서비스

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | FastAPI (Python 3.11), SQLAlchemy, Alembic |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Database | MariaDB 10.11 |
| Auth | JWT (python-jose) |
| Realtime | WebSocket (채팅) |
| Container | Docker + Docker Compose |

## 프로젝트 구조

```
market/
├── backend/                # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── core/          # config, security, database
│   │   ├── models/        # SQLAlchemy 모델 (MariaDB)
│   │   ├── routers/       # API 라우터 (auth, categories, items ...)
│   │   ├── services/      # 비즈니스 로직
│   │   ├── schemas/       # Pydantic 스키마
│   │   ├── crud/          # DB CRUD (선택)
│   │   └── websocket/     # WebSocket 채팅
│   ├── alembic/           # DB 마이그레이션
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # Next.js
│   └── src/
│       ├── app/           # App Router 페이지
│       ├── components/    # UI 컴포넌트
│       ├── lib/           # API 클라이언트
│       ├── store/         # Zustand 상태 관리
│       └── types/
├── docs/sql/schema.sql    # DB 스키마
├── nginx/nginx.conf
└── docker-compose.yml
```

## 핵심 기능 (MVP)

- **인증**: 이메일 회원가입, JWT 로그인
- **동네 설정**: 행정동 리스트에서 선택 (최대 2개, 지도 없음)
- **상품**: 등록/수정/삭제, 이미지 업로드, 카테고리 필터
- **거래 상태**: 판매중 / 예약중 / 판매완료
- **관심 상품**: 찜하기
- **채팅**: 1:1 WebSocket 실시간 채팅
- **후기**: 거래 완료 후 후기 및 매너 점수
- **관리자**: 카테고리 CRUD, 회원/상품/신고 관리

## 시작하기

```bash
# 환경변수 설정
cp backend/.env.example backend/.env

# Docker로 실행
docker-compose up -d

# backend 컨테이너는 시작 시 자동으로 아래를 수행합니다.
# - DB 대기
# - alembic upgrade head
# - 기본 지역/카테고리 시드
# - items 테이블이 비어 있으면 데모 상품 시드

# 또는 개발 서버 직접 실행
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 개발 데이터 부트스트랩

```bash
cd backend

# 지역 + 카테고리만 채우기
python scripts/bootstrap_dev_data.py

# 지역 + 카테고리 + 데모 상품 채우기
python scripts/bootstrap_dev_data.py --with-items
```

## E2E 테스트

```bash
# 1) 백엔드 실행
cd backend
uvicorn app.main:app --reload

# 2) 프론트 실행
cd ../frontend
npm install
npm run dev

# 3) Playwright 브라우저 설치 (최초 1회)
npx playwright install chromium

# 4) 브라우저 E2E 실행
npm run e2e
```

- 기본 대상 URL은 `http://127.0.0.1:3000` 입니다.
- E2E는 회원가입·로그인, 인증 페이지, 상품 등록·수정·삭제, 찜하기, 채팅, 후기·신고 흐름을 점검합니다.
- 실행 전 백엔드 시드 데이터(지역, 카테고리, 상품)가 준비되어 있어야 합니다.

## API 문서

서버 실행 후: http://localhost:8000/docs

## Notion 문서

[동네마켓 프로젝트 문서](https://www.notion.so/322fe7bc942b80e8b7eac3271e9540d0)
- [1. 프로젝트 정의서](https://www.notion.so/1-322fe7bc942b816fb57fd1325da9669e)
- [2. 프로젝트 명세서](https://www.notion.so/2-322fe7bc942b816d897ee06de82b2b8b)
- [3. 서비스 아키텍처](https://www.notion.so/3-322fe7bc942b810faa72e649e3c5d404)
- [4. ERD 설계](https://www.notion.so/4-ERD-322fe7bc942b81959f63dc6efc46b2b5)
- [5. DB 테이블 스키마](https://www.notion.so/5-DB-322fe7bc942b818986f3c7ff0016d72a)
- [6. API 명세](https://www.notion.so/6-API-322fe7bc942b813b8415c6c698b62b11)
- [7. 폴더 구조](https://www.notion.so/7-322fe7bc942b812fb06edd38d67eb6f2)
- [8. MVP 기능 목록](https://www.notion.so/8-MVP-322fe7bc942b816481d0dcb8ed15f15b)