# AmazoCart 데이터베이스 & 백엔드 심층 가이드

아마존 스타일 전자상거래 데모의 MariaDB 스키마, 배포, 성능 최적화, 서버 접근 로직을 한 번에 정리한 장문 리포트다. 스키마 설계 의도, 인덱스·트리거·프로시저, 대량 적재, API 쿼리 패턴을 모두 담았다.

## 1. 전체 구성 개요
- RDBMS: MariaDB (MySQL 호환), 문자셋 `utf8mb4`, DB명 `amazon_db`.
- 데이터 양: Product 약 704만 건(대량 CSV), Category 1,024건, Country 4건, 장바구니/주문은 애플리케이션 생성.
- 서버: `server.js`(Express + mysql2/promise)에서 풀링(connection pool 20), 인덱스 힌트와 캐시(Map)로 목록/검색 가속.
- 데이터 적재/마이그레이션: `DDL_MariaDB.sql` → `performance_indexes.sql` → `migration_MariaDB.sql` 순으로 적용.
- 보조 스크립트: `Trigger.sql`, `event_scheduler.sql`, `procedure01~03.sql`, `view.sql`, `꿀팁.sql`(샘플 집계 쿼리).

## 2. 핵심 테이블 설계 의도
- **Country**  
  - PK: `country_id VARCHAR(10)`; 컬럼: `country`, `currency`, `monetary`.  
  - 역할: 국가/통화 정보, Category·Product의 지역 스코프 기준.
- **Category**  
  - PK: `category_id INT`; FK: `(category_id, country_id) -> Country.country_id`; UNIQUE(category_id, country_id).  
  - 역할: 국가별 카테고리 라벨. 복합 FK로 동일 category_id라도 국가별 분기 가능.
- **User**  
  - PK: `user_id AUTO_INCREMENT`; UNIQUE(name), UNIQUE(email).  
  - 역할: 이메일 기반 데모 로그인; 최소 필수 컬럼만 유지해 단순 흐름 보장.
- **Product**  
  - PK: `product_id VARCHAR(20)`; FK: `country_id -> Country`, `(category_id, country_id) -> Category`.  
  - 컬럼: `product_name`, `image`, `price DECIMAL(10,2)`, `rating DECIMAL(2,1)`, `review_count INT`.  
  - 의도: 대량 데이터(7M+) 대응을 위해 가볍게 설계, 리뷰/평점은 집계 필드로 포함.
- **Cart / Cart_Item**  
  - Cart PK: `cart_id`, FK: `user_id -> User`. `is_active`, `created_at`, `expires_at` 관리.  
  - Cart_Item PK: `cart_item_id`; FK: `cart_id -> Cart`, `product_id -> Product`; 수량/추가일 저장.  
  - 의도: 사용자별 단일 활성 카트(`getOrCreateCart`)를 전제로 CRUD 단순화.
- **Orders / Order_Item**  
  - Orders PK: `order_id VARCHAR(50)`; FK: `user_id -> User`; 금액, 상태, 배송지, 생성일 포함.  
  - Order_Item PK: `order_item_id`; FK: `order_id -> Orders`, `product_id -> Product`; 주문 시점 스냅샷(가격/상품명) 저장.  
  - 의도: 주문 후에도 원본 상품 변경에 영향받지 않도록 스냅샷 컬럼 유지.

## 3. 테이블별 제약조건 & 무결성 포인트
- 모든 FK는 InnoDB 엔진에서 즉시 검증; 대량 적재 시 `FOREIGN_KEY_CHECKS`를 일시 비활성화 후 재활성화.
- Product.category_id는 Country와 Category를 모두 참조하므로 `(category_id, country_id)` 복합 FK로 국가별 무결성 보장.
- User.email / name UNIQUE로 중복 가입 방지(단, 데모 로그인은 동일 이메일로 upsert 형태).
- Cart 트리거(`trg_cart_expires`)가 만료일을 자동 설정해 입력 누락 방지.
- Order_Item 트리거(`trg_order_item_amount`)가 금액을 자동 계산해 계산 오류를 줄인다.

## 4. 인덱스 전략 (`performance_indexes.sql`)
- **검색/정렬**  
  - `ft_product_name`: 상품명 FULLTEXT, `MATCH ... AGAINST`에 사용.  
  - `idx_product_sort_popular`: `(review_count, rating, product_id)` 기본 인기 정렬.  
  - `idx_product_price_sort`: `(price, product_id)` 가격 정렬 안정성 확보.  
  - `idx_product_rating_sort`: `(rating, review_count, product_id)` 평점 정렬.
- **필터**  
  - `idx_product_category_popular`: `(category_id, country_id, review_count, rating, product_id)` 카테고리+국가 필터 후 인기순.  
  - `idx_category_name_country`: 카테고리명+국가로 슬러그/검색 시 가속.  
  - `idx_product_country`(선택): 국가별 전체 조회 대비.
- **업데이트/트랜잭션 편의**  
  - `idx_cart_item_cart_product`: 카트+상품 조합 upsert 및 조회 최적화.  
  - `idx_orders_user_created`: 사용자 주문 이력 최신순 조회 최적화.
- 서버 쿼리에서 `FORCE INDEX` 힌트를 사용해 옵티마이저가 긴 리스트에서도 원하는 플랜을 택하도록 강제.

## 5. 대량 적재 & 마이그레이션 (`migration_MariaDB.sql`)
- CSV 준비: `country_lf.csv`, `category_lf.csv`, `product_lf.csv`를 `/var/lib/mysql/` 또는 홈 디렉토리에 배치 후 권한 부여.
- 순서: FK 체크 OFF → 테이블 TRUNCATE → Country → Category → Product 순 `LOAD DATA INFILE`.  
  - Product는 `IGNORE` 옵션으로 중복 `product_id`를 건너뛰어 700만 건 적재 시 오류 중단을 방지.  
  - ESCAPED BY '' 로 백슬래시 이스케이프를 끔(데이터 그대로 로드).
- 적재 후 FK 체크 ON, 집계 확인 쿼리로 로드 건수를 검증.
- 성능 팁: 로드 전 인덱스를 최소화하고, 적재 후 `performance_indexes.sql` 실행으로 빌드 시간을 통제.

## 6. 트리거, 이벤트 스케줄러 (`Trigger.sql`, `event_scheduler.sql`)
- `trg_order_item_amount` (BEFORE INSERT ON Order_Item): `amount = price_at_order * quantity` 자동 계산.
- `trg_cart_expires` (BEFORE INSERT ON Cart): `expires_at`이 비어 있으면 `created_at + 7 DAY`로 기본 만료일 설정.
- `trg_order_deactivate_cart` (AFTER INSERT ON Orders): 동일 사용자 활성 카트를 비활성화 → 주문 후 카트 중복 사용 방지.
- 이벤트 스케줄러 `ev_cleanup_old_carts`: 매일 자정, 비활성 카트 중 30일 지난 건 삭제. `SET GLOBAL event_scheduler = ON` 필요.

## 7. 저장 프로시저 (`procedure01~03.sql`)
- `sp_cancel_order(p_order_id)`: 주문 상태를 `cancelled`로 업데이트. 트랜잭션으로 All-or-Nothing 보장.
- `sp_checkout(p_user_id, p_order_id, p_address, p_shipping_country)`:  
  - 활성 카트 조회 → 총액 계산 → 임시 테이블에 주문 항목 스냅샷 → Orders 삽입 → Order_Item 복사 → Cart_Item 삭제 → COMMIT.  
  - 트리거(`trg_order_deactivate_cart`)와 함께 카트 비활성화까지 자동 연계.
- `sp_update_order_status(p_order_id, p_status)`: 주문 상태 변경 및 결과 반환. 간단한 상태 머신 역할.

## 8. 뷰 (`view.sql`)와 샘플 집계 (`꿀팁.sql`)
- `v_order_details`: 주문 + 사용자 + 주문항목 조인 뷰. 고객별 주문 상세를 단일 뷰에서 조회.
- `v_product_stats`: 국가별 상품 수, 평균 가격, 평균 평점 집계. 700만 건 기준 4분 내외 소요(풀스캔).
- 샘플 집계: `꿀팁.sql`에 베스트셀러(판매량/매출) TOP 10, 고객별 총 주문금액 집계 예시 포함.

## 9. 백엔드 서버 쿼리 흐름 (`server.js` 기준)
- 공통: `mysql2/promise` 풀, `query/execute` 래퍼 제공. in-memory 캐시(Map)로 인기/카테고리/국가 통계 단기 캐싱(2~5분).
- 로그인 `/api/auth/login`: 이메일로 User 조회 → 없으면 INSERT → 활성 카트 생성(`getOrCreateCart`).
- 상품 목록 `/api/products`  
  - 파라미터: `limit/offset/category/minPrice/maxPrice/sort/q/cursor`.  
  - 정렬: popular(review_count DESC, rating DESC), price-low/high, rating, newest.  
  - 카테고리 필터 시 `resolveCategoryFilters`로 슬러그/이름 → (category_id, country_id) 매핑.  
  - 검색 시 FULLTEXT, 인기/가격 정렬 시 복합 인덱스 강제.  
  - 기본 인기 목록은 캐시, `X-Next-Cursor`(newest+cursor)로 키셋 유사 동작 지원.
- 상품 인기 `/api/products/popular`: 기본 인기 인덱스 사용, 캐시 2분.
- 단일 상품 `/api/products/:id`: 카테고리 조인 포함.
- 변형 상품 `/api/products/:id/variants`:  
  - 대상 상품 조회 → variant 검색어 구성(`buildVariantSearchTerm`) → FULLTEXT + LIKE + 동일 카테고리 fallback → `buildVariantKey`로 근사 그룹핑 후 대상 포함.
- 카테고리 `/api/categories`: 상품수 집계, 슬러그 포함, 캐시 5분.
- 국가 통계 `/api/stats/countries`: COUNT/AVG 집계, 캐시 5분.
- 카트 `/api/cart`, `/api/cart/add`, `/api/cart/update`, `/api/cart/item/:productId`:  
  - 사용자 활성 카트 보장 → Cart_Item upsert(인덱스 활용) → 수량 0이면 삭제.
- 주문 `/api/orders`: 사용자별 주문 + 주문항목 조인.  
  - `Orders` 인덱스 강제(`idx_orders_user_created`).  
  - `/api/orders/checkout`: 활성 카트 → 총액 → Orders/Order_Item INSERT → Cart_Item 비움.
- 헬스 체크 `/api/health`: DB 연결 확인.

## 10. 성능/운영 체크리스트
- 커넥션 풀: 기본 20, 대량 트래픽 시 DB 커넥션/메모리 한도에 맞춰 조정.
- 캐시: 변형/카테고리/인기 목록은 짧은 TTL(2~5분). Redis로 교체 시 멀티 인스턴스 안전성 확보.
- 대량 적재: 인덱스/트리거 OFF → 데이터 로드 → 인덱스 재생성 순서를 지켜야 7M 건을 10분 내 처리.  
- 통계 쿼리: `v_product_stats` 같이 풀스캔 쿼리는 오프라인/백그라운드 실행 후 캐시 추천.
- 장애 대응: `sp_cancel_order`, `sp_update_order_status`로 수동 정정, 카트 만료 이벤트로 데이터 정리.
- 백업: CSV 원본 + `mysqldump --single-transaction --quick --routines --triggers amazon_db` 권장.

## 11. 확장/개선 제안
- 트래픽 급증 시: Redis 캐시, CDN 이미지, API rate limit, 읽기 레플리카 도입.
- 검색 고도화: ngram/fulltext 멀티 언어 설정, prefix index, 검색 로그 기반 인덱스 튜닝.
- 주문 흐름: 결제 상태 머신(placed/paid/shipped/refunded) 테이블화, 이벤트 소싱 큐 도입.
- 데이터 품질: Product에 브랜드/옵션 스키마 분리, Review 테이블 추가 후 `product_with_reviews` 뷰/머티리얼라이즈드 뷰 적용.
- 모니터링: Slow query log + Performance Schema로 옵티마이저 플랜 점검, Grafana/Prometheus 연동.

## 12. 실행/테스트 요약
1) 스키마/인덱스 적용  
```bash
mysql -u root -p < DDL_MariaDB.sql
mysql -u root -p < performance_indexes.sql
```
2) 데이터 로드  
```bash
mysql -u root -p < migration_MariaDB.sql
```
3) 트리거·프로시저·뷰·이벤트  
```bash
mysql -u root -p < Trigger.sql
mysql -u root -p < procedure01.sql
mysql -u root -p < procedure02.sql
mysql -u root -p < procedure03.sql
mysql -u root -p < view.sql
mysql -u root -p < event_scheduler.sql
```
4) 서버 실행  
```bash
cd backend
cp .env.example .env   # DB_HOST/PORT/USER/PASSWORD/DB_NAME 입력
node server.js
```

이 문서는 DB와 서버가 어떻게 연결되고, 어떤 인덱스·트리거·프로시저가 어떤 의도로 배치됐는지까지 포함한 레퍼런스다. 실환경에서는 데이터 크기, 장비 사양, 트래픽 특성에 맞춰 인덱스와 캐싱을 조정하면 된다.
