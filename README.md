# AmazoCart

Amazon 스타일 레퍼런스를 바탕으로 한 전자상거래 데모 애플리케이션.

## 구조

```text
/AmazoCart   # 프론트엔드: React + Vite + Tailwind + React Query
/backend     # Express + SQLite: 제품/카테고리/상품상세 API
```

### 프론트엔드 폴더

- `src/components/layout` 헤더·푸터·네비게이션
- `src/components/products` 상품 카드 + 스켈레톤
- `src/pages` 라우트 페이지 (Home / ProductDetail / Category / Categories / Search / Cart / Login / Orders)
- `src/hooks` React Query 기반 커스텀 훅
- `src/lib` API 클라이언트 (axios)
- `src/types` 공유 타입
- `src/i18n.ts`, `src/locales/*` 다국어 리소스 (ko/en)

### API (현재 서버)

- `GET /api/products` 목록 (쿼리: limit, offset, category, minPrice, maxPrice, sort, q[상품명])
  - 카테고리는 `category_main` 기반이며 slug(`slug`)를 함께 반환 → `/category/:slug` 경로에서 사용
- `GET /api/products/:id` 단건 조회
- `GET /api/categories` 카테고리 + 상품수
- `POST /api/auth/login` 이메일 기반 데모 로그인(사용자 생성/조회)
- `GET /api/cart?userId` / `POST /api/cart/add` / `POST /api/cart/update` / `DELETE /api/cart/item/:productId`
- `POST /api/orders/checkout` (cart → order 전환), `GET /api/orders?userId`

### 향후 확장 계획

1. 검색 파라미터 `q` 지원(상품명 LIKE)
2. 리뷰 조회/작성 `GET/POST /api/products/:id/reviews`
3. 장바구니 실데이터 (cart, cart_items 테이블 사용) CRUD
4. 인증(세션/JWT) 및 User 등록
5. 주문/결제 흐름 (orders, order_items) 추가
6. MySQL 전환 (`physical_model_final.sql`) 프로덕션 환경

### 색상 (Amazon 스타일)

- Header Navy: `#131921`
- Dark Panel: `#232f3e`
- Accent Yellow: `#febd69`
- Accent Orange: `#f08804`
- Link Blue: `#007185`
- Background Gray: `#e3e6e6`

### 실행 방법

백엔드 (MySQL / MariaDB):

```bash
cd backend
cp .env.example .env  # DB 접속 정보 입력
npm install
# 사전에 DDL_MariaDB.sql + 데이터 적재 필요 (예: migration_MariaDB.sql)
node server.js  # amazon_db(MySQL)에서 직접 데이터 제공
```

프론트엔드:

```bash
cd AmazoCart
npm install
npm run dev
```

브라우저 열기: <http://localhost:5173> (Vite 기본 포트) / API: <http://localhost:3003>


- Product / Category / Review / User / Cart / CartItem / Order / OrderItem
- `ecommerce_db.sql` SQLite 초기 스키마, `physical_model_final.sql` MySQL 확장 버전

### 디자인 · 동작 포인트

- 네비게이션 검색창: 상품명 검색(q 파라미터) → `/search?q=` 라우트로 이동
- 카테고리 바: API에서 불러온 카테고리(+상품 수, slug) 기반으로 링크 구성, `/categories` 페이지에서 전체 목록 제공
- 상품카드/상세: 카테고리명(category_name alias)과 평점/리뷰 수 안전 표기, 로딩 시 스켈레톤 노출
- 로그인/장바구니/주문: 이메일 기반 데모 로그인 → 장바구니 추가/수량 변경/삭제 → 결제(주문 생성) → 주문내역 조회 흐름 동작

### MySQL 스키마 참고(physical_model_final.sql)

- `products`: product_id, product_name, price, image, category_id, country_id, created_at, avg_rating/review_count는 `product_with_reviews` 뷰로 계산
- `categories`: category_id, category (카테고리 바/필터링에 사용)
- `reviews`: rating(0~5), review_text, user_id → 상품 평점 집계
- `users`: name/email/phone 기본 정보, created_at
- `carts` / `cart_items`: 장바구니 식별자·수량·만료일 관리 (매일 2시에 만료 이벤트 포함)
- `orders` / `order_items`: 주문 상태(PENDING~REFUNDED), 총액, 배송국가, 주문 항목 스냅샷
- `countries`: 국가 코드·통화·화폐기호

MySQL 초기화 예시:

```bash
mysql -u root -p < physical_model_final.sql
# 애플리케이션에서 사용하는 DB 이름: ecommerce_db
```

### MySQL 기반 데이터 로드 (backend)

- `backend/DDL_MariaDB.sql`, `migration_MariaDB.sql`, `Trigger.sql`, `view.sql` 등을 Amazon DB에 적용
- 운영 DB는 `amazon_db`로 가정하며 Product/Category/User/Cart/Order 스키마는 위 DDL과 동일
- 서버는 `.env`의 DB 접속 정보로 MariaDB/MySQL에 직접 연결하여 데이터를 반환
- CSV를 활용하고 싶다면 별도로 MySQL에 적재 후 서버를 실행하면 됩니다.

### 다음 단계 제안

- [ ] 서버에 검색 기능(q) 추가
- [ ] 리뷰 뷰(`product_with_reviews`) 활용 응답 정규화
- [ ] 카트 테이블로 통합 후 상태 연동
- [ ] React Query 캐시 시간 조정 및 에러 바운더리

---
Created for iterative development toward an Amazon-inspired commerce platform.
