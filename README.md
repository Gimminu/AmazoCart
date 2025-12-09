# AmazoCart

> 아마존(Amazon) 스타일을 참고한 **완성도 높은 전자상거래 플랫폼** 데모입니다.
>
> **React + Vite + TypeScript** 프론트엔드와 **Express + MariaDB/MySQL** 백엔드로 구성된 풀스택 이커머스 애플리케이션입니다.

---

## 📋 주요 기능

### 🛍️ 사용자 경험

- **상품 검색 & 필터링**: 카테고리, 가격, 정렬, 상품명 검색
- **다국어 지원**: 영어(en), 한국어(ko), 캐나다 영어/프랑스어(en-CA, fr-CA), 인도 영어/힌디어(en-IN, hi-IN) 등 7개 언어
- **스켈레톤 로딩**: 부드러운 UX를 위한 로딩 상태 표시
- **장바구니 관리**: 상품 추가/제거/수량 수정
- **주문 관리**: 체크아웃 및 주문 내역 조회
- **반응형 디자인**: Tailwind CSS로 모바일/태블릿/데스크톱 최적화

### ⚙️ 백엔드 기능

- **대규모 데이터 처리**: 700만+ 상품 데이터 효율적 관리
- **데이터베이스**: MariaDB/MySQL 커넥션 풀 및 인덱스 최적화
- **인증**: 이메일 기반 데모 로그인
- **API 설계**: RESTful 아키텍처로 직관적인 엔드포인트
- **성능 최적화**: 캐싱, 인덱스, 트리거, 이벤트 스케줄러

---

## 🏗️ 프로젝트 구조

```
AmazoCart/
├── src/                          # 프론트엔드 소스
│   ├── components/
│   │   ├── common/              # 공용 컴포넌트 (페이지네이션 등)
│   │   ├── insights/            # 대시보드 컴포넌트
│   │   ├── layout/              # 레이아웃 (헤더, 푸터, 네비게이션, 캐러셀)
│   │   └── products/            # 상품 컴포넌트 (카드, 행, 스켈레톤)
│   ├── pages/                   # 라우트별 페이지
│   │   ├── Home.tsx             # 메인 페이지
│   │   ├── ProductDetail.tsx    # 상품 상세
│   │   ├── Category.tsx         # 카테고리별 상품
│   │   ├── Categories.tsx       # 전체 카테고리
│   │   ├── Search.tsx           # 검색 결과
│   │   ├── Cart.tsx             # 장바구니
│   │   ├── Login.tsx            # 로그인
│   │   └── Orders.tsx           # 주문 내역
│   ├── hooks/                   # React Query 커스텀 훅
│   ├── context/                 # React Context (인증, 지역 설정)
│   ├── lib/                     # 유틸리티 (API 클라이언트, 타입 변환)
│   ├── types/                   # TypeScript 타입 정의
│   ├── locales/                 # i18n 다국어 파일
│   ├── css/                     # 글로벌 스타일
│   └── main.tsx                 # 앱 진입점
│
├── backend/                     # 백엔드 소스
│   ├── server.js                # Express 서버
│   ├── package.json
│   └── SQL 파일들
│       ├── DDL_MariaDB.sql      # 테이블 생성 DDL
│       ├── migration_MariaDB.sql # 데이터 마이그레이션
│       ├── performance_indexes.sql # 인덱스 생성
│       ├── view.sql             # 뷰 정의
│       ├── Trigger.sql          # 트리거
│       ├── event_scheduler.sql  # 이벤트 스케줄러
│       └── procedure*.sql       # 저장 프로시저
│
├── infra/                       # 인프라 설정
│   └── nginx/
│       └── amazocart.conf       # Nginx 프록시 설정
│
├── scripts/                     # 배포/관리 스크립트
│   ├── amazocart-start.sh
│   ├── amazocart-stop.sh
│   └── check-backend.sh
│
├── package.json                 # 프론트엔드 의존성
├── vite.config.ts              # Vite 설정
├── tailwind.config.js           # Tailwind CSS 설정
├── postcss.config.js           # PostCSS 설정
└── tsconfig.json               # TypeScript 설정
```

---

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 16+ (또는 18+)
- MySQL/MariaDB 5.7+ 또는 8.0+
- npm 또는 yarn

### 1️⃣ 백엔드 설정

```bash
# 1. 백엔드 폴더로 이동
cd backend

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
# .env 파일을 생성하고 아래 내용 추가:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=amazon_db
# DB_PORT=3306

# 4. 데이터베이스 초기화 (MySQL/MariaDB)
mysql -u root -p amazon_db < DDL_MariaDB.sql
mysql -u root -p amazon_db < performance_indexes.sql
mysql -u root -p amazon_db < migration_MariaDB.sql
mysql -u root -p amazon_db < view.sql
mysql -u root -p amazon_db < Trigger.sql

# 5. 서버 실행
npm start
# 서버가 http://localhost:3003 에서 실행됩니다
```

### 2️⃣ 프론트엔드 설정

```bash
# 1. 프로젝트 루트로 이동
cd AmazoCart

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev
# 앱이 http://localhost:5173 에서 실행됩니다
```

### 3️⃣ 동시 실행 (선택사항)

```bash
# 프론트엔드 루트에서
npm run dev:all
# 이 명령은 프론트엔드와 백엔드를 동시에 실행합니다
```

---

## 📡 API 엔드포인트

### 상품 API

- `GET /api/products` - 상품 목록 조회
  - 쿼리: `limit`, `offset`, `category`, `minPrice`, `maxPrice`, `sort`, `q` (검색어)
- `GET /api/products/:id` - 상품 상세 조회

### 카테고리 API

- `GET /api/categories` - 모든 카테고리 (상품 수 포함)
- `GET /api/categories/:slug` - 특정 카테고리 상품 (슬러그 기반)

### 인증 API

- `POST /api/auth/login` - 이메일 기반 로그인 (사용자 자동 생성)

### 장바구니 API

- `GET /api/cart?userId=:userId` - 사용자 장바구니 조회
- `POST /api/cart/add` - 상품 추가
- `POST /api/cart/update` - 수량 수정
- `DELETE /api/cart/item/:productId` - 상품 제거

### 주문 API

- `POST /api/orders/checkout` - 결제 (장바구니 → 주문)
- `GET /api/orders?userId=:userId` - 사용자 주문 내역

---

## 🗄️ 데이터베이스 스키마

### 핵심 테이블

#### `countries` - 국가 정보

```sql
- country_id: VARCHAR(10) PRIMARY KEY
- country: VARCHAR(100) - 국가명
- currency: VARCHAR(50) - 통화
- monetary: VARCHAR(10) - 통화 기호
```

#### `categories` - 카테고리

```sql
- category_id: INT PRIMARY KEY
- country_id: VARCHAR(10) FOREIGN KEY
- category: VARCHAR(255) - 카테고리명
- UNIQUE(category_id, country_id)
```

#### `products` - 상품

```sql
- product_id: VARCHAR(20) PRIMARY KEY
- country_id: VARCHAR(10) FOREIGN KEY
- category_id: INT FOREIGN KEY
- product_name: VARCHAR(255)
- image: VARCHAR(500) - 이미지 URL
- price: DECIMAL(10,2)
- rating: DECIMAL(2,1) - 평점
- review_count: INT - 리뷰 수
```

#### `users` - 사용자

```sql
- user_id: INT AUTO_INCREMENT PRIMARY KEY
- name: VARCHAR(255) UNIQUE
- email: VARCHAR(255) UNIQUE
- phone: VARCHAR(20)
- created_at: TIMESTAMP
```

#### `carts` - 장바구니

```sql
- cart_id: INT AUTO_INCREMENT PRIMARY KEY
- user_id: INT FOREIGN KEY
- is_active: BOOLEAN
- created_at: TIMESTAMP
- expires_at: TIMESTAMP
```

#### `cart_items` - 장바구니 아이템

```sql
- cart_item_id: INT AUTO_INCREMENT PRIMARY KEY
- cart_id: INT FOREIGN KEY
- product_id: VARCHAR(20) FOREIGN KEY
- quantity: INT
- added_at: TIMESTAMP
```

#### `orders` - 주문

```sql
- order_id: INT AUTO_INCREMENT PRIMARY KEY
- user_id: INT FOREIGN KEY
- total_amount: DECIMAL(10,2)
- order_status: VARCHAR(50) - PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
- country_id: VARCHAR(10)
- created_at: TIMESTAMP
```

#### `order_items` - 주문 항목

```sql
- order_item_id: INT AUTO_INCREMENT PRIMARY KEY
- order_id: INT FOREIGN KEY
- product_id: VARCHAR(20)
- quantity: INT
- price_at_purchase: DECIMAL(10,2)
```

---

## 🎨 디자인 가이드

### 색상 팔레트 (Amazon 스타일)

| 용도          | 색상 코드 | 설명           |
| ------------- | --------- | -------------- |
| 헤더          | `#131921` | 진한 네이비    |
| 패널 배경     | `#232f3e` | 진한 파란-회색 |
| 강조색 (버튼) | `#febd69` | 밝은 노란색    |
| 강조색 (호버) | `#f08804` | 주황색         |
| 링크          | `#007185` | 청록색         |
| 배경          | `#e3e6e6` | 밝은 회색      |

### Tailwind CSS 사용

- 모든 스타일링은 Tailwind CSS 유틸리티 클래스 사용
- `PostCSS`와 `Autoprefixer` 자동 처리
- 커스텀 설정은 `tailwind.config.js` 참고

---

## 🌍 다국어 지원 (i18n)

### 지원 언어

- 🇰🇷 한국어 (ko)
- 🇬🇧 영어 (en)
- 🇨🇦 캐나다 영어 (en-CA)
- 🇬🇧 영국 영어 (en-GB)
- 🇮🇳 인도 영어 (en-IN)
- 🇨🇦 캐나다 프랑스어 (fr-CA)
- 🇮🇳 인도 힌디어 (hi-IN)

### i18n 설정

- `src/i18n.ts` - i18next 초기화
- `src/locales/[language]/translation.json` - 번역 파일
- `useTranslation()` 훅으로 컴포넌트에서 사용

---

## 📦 핵심 의존성

### 프론트엔드

- **React 18** - UI 라이브러리
- **Vite 5** - 빠른 빌드 도구
- **TypeScript** - 타입 안정성
- **Tailwind CSS 3** - 유틸리티 CSS
- **React Router 6** - 클라이언트 라우팅
- **React Query 5** - 서버 상태 관리
- **Axios** - HTTP 클라이언트
- **React Hook Form 7** - 폼 상태 관리
- **i18next** - 국제화

### 백엔드

- **Express 4** - 웹 서버 프레임워크
- **MySQL2** - 데이터베이스 드라이버
- **CORS** - 교차 출처 리소스 공유
- **Compression** - 응답 압축
- **Dotenv** - 환경 변수 관리
- **HTTP Proxy Middleware** - 프록시 설정
- **Nodemon** (개발용) - 파일 변경 감지

---

## 🔧 개발 가이드

### 스크립트 명령어

**프론트엔드:**

```bash
npm run dev           # 개발 서버 실행
npm run dev:all      # 프론트엔드 + 백엔드 동시 실행
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 결과 미리보기
```

**백엔드:**

```bash
npm start            # 서버 실행
npm run dev          # 개발 서버 실행
npm run start:fresh  # DB 초기화 후 서버 실행 (SQLite 사용 시)
```

### 환경 설정

#### 프론트엔드 (Vite)

- `VITE_DEV_HOST` - 개발 서버 호스트 (기본값: 0.0.0.0)
- `VITE_DEV_PORT` - 개발 서버 포트 (기본값: 5173)
- `VITE_PUBLIC_HOST` - 공개 서버 호스트
- `VITE_PUBLIC_PORT` - 공개 서버 포트 (기본값: 443)
- `VITE_PUBLIC_PROTOCOL` - 프로토콜 (기본값: https)

#### 백엔드 (.env)

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=amazon_db
DB_PORT=3306
NODE_ENV=development
```

### 코드 구조

#### 커스텀 훅 (src/hooks/)

- `useProducts()` - 상품 목록 조회
- `useCategories()` - 카테고리 조회
- `useCart()` - 장바구니 관리
- `useOrders()` - 주문 조회
- `useUserRegion()` - 사용자 지역 설정
- `useCurrencyFormatter()` - 통화 포맷팅

#### Context API (src/context/)

- `AuthContext` - 사용자 인증 상태
- `RegionContext` - 사용자 지역/통화 설정

#### API 클라이언트 (src/lib/api.ts)

```typescript
// 모든 API 요청은 여기서 관리됨
export const api = {
  products: {
    getList(params) { ... },
    getDetail(id) { ... }
  },
  // 더 많은 엔드포인트...
}
```

---

## 🚨 주요 설계 결정

### 1. **상품 정보 최소화**

상품 정보는 기본 필드만 포함해 대규모 데이터(700만+) 처리 성능 최적화

### 2. **국가별 카테고리 분기**

`categories` 테이블의 복합 FK로 동일 `category_id`가 국가별로 다를 수 있음

### 3. **데모 로그인**

이메일 기반 자동 사용자 생성으로 인증 복잡도 낮춤

### 4. **React Query 활용**

서버 상태 관리를 React Query로 통일해 캐싱 및 동기화 효율화

### 5. **스켈레톤 로딩**

UX 개선을 위해 로딩 중 스켈레톤 UI 표시

---

## 📈 성능 최적화

### 데이터베이스

- **인덱스**: 상품명, 카테고리, 가격 등 자주 조회되는 컬럼에 인덱스 생성
- **커넥션 풀**: Express 서버에서 MySQL 풀 크기 20으로 설정
- **쿼리 캐싱**: Map을 이용한 카테고리 캐시
- **트리거 & 이벤트**: 자동 만료, 집계 데이터 업데이트

### 프론트엔드

- **코드 스플리팅**: 라우트별 동적 로딩
- **이미지 최적화**: 상품 이미지는 외부 URL 사용
- **React Query 캐싱**: 자동 재검증 및 백그라운드 리페치

---

## 🔍 트러블슈팅

### 데이터베이스 연결 실패

```bash
# 1. MariaDB/MySQL 서비스 확인
sudo service mariadb status

# 2. 접근 권한 확인
mysql -u root -p -e "SELECT VERSION();"

# 3. 환경 변수 확인
cat .env
```

### 포트 충돌

```bash
# 3003 포트 확인
lsof -i :3003
netstat -tulpn | grep 3003

# 5173 포트 확인
lsof -i :5173
```

### CORS 오류

`backend/server.js`의 CORS 설정 확인:

```javascript
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
```

---

## 📚 추가 자료

- **SQL 상세 가이드**: `backend/README_SQL.md` 참고
- **Vite 문서**: https://vitejs.dev
- **React Query 문서**: https://tanstack.com/query
- **Tailwind CSS**: https://tailwindcss.com
- **MariaDB**: https://mariadb.org

---

## 📝 라이선스

이 프로젝트는 학습 및 데모 목적으로 제작되었습니다.

---

## 🎯 다음 단계 (Roadmap)

- [ ] 완전한 상품 리뷰 시스템 (조회/작성/삭제)
- [ ] 결제 시스템 통합 (결제 게이트웨이)
- [ ] 고급 검색 필터 (브랜드, 등급, 판매자)
- [ ] 관리자 대시보드
- [ ] 이메일 알림
- [ ] 상품 추천 엔진
- [ ] WebSocket 실시간 업데이트
- [ ] Docker & Kubernetes 배포
- [ ] CI/CD 파이프라인
- [ ] 모니터링 및 로깅 (ELK 스택)

---

**Created for iterative development toward a production-grade Amazon-inspired e-commerce platform.**

Last updated: December 2025
