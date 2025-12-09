-- ============================================
-- Amazon E-Commerce Database Migration (MariaDB)
-- 라즈베리파이 서버 전용 (Linux/LF 줄바꿈)
-- ============================================
--
-- 사전 준비:
-- 1. CSV 파일을 서버에 복사:
--    sudo cp country_lf.csv category_lf.csv product_lf.csv /var/lib/mysql/
--    sudo chown mysql:mysql /var/lib/mysql/*.csv
--
-- 2. 또는 홈 디렉토리 사용 시:
--    cp *.csv /home/minu/
--    (아래 경로 수정 필요)
--
-- 주의사항:
-- - ESCAPED BY '' : 백슬래시(\) 이스케이프 비활성화
-- - IGNORE : 중복 product_id 건너뛰기 (327,245건 중복 존재)
-- - 예상 결과: Country 4건, Category 1,024건, Product ~7,040,560건
-- ============================================

USE amazon_db;

-- FK 체크 비활성화 (로드 속도 향상 + TRUNCATE 허용)
SET FOREIGN_KEY_CHECKS = 0;

-- 기존 데이터 초기화
TRUNCATE TABLE Product;
TRUNCATE TABLE Category;
TRUNCATE TABLE Country;

-- ============================================
-- 1. Country 테이블 (4건)
-- ============================================
LOAD DATA INFILE '/var/lib/mysql/country_lf.csv'
INTO TABLE Country
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
ESCAPED BY ''
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

SELECT * FROM Country;

-- ============================================
-- 2. Category 테이블 (1,024건)
-- ============================================
LOAD DATA INFILE '/var/lib/mysql/category_lf.csv'
INTO TABLE Category
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
ESCAPED BY ''
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

SELECT COUNT(*) AS category_count FROM Category;

-- ============================================
-- 3. Product 테이블 (~7,040,560건, 약 5~10분 소요)
-- IGNORE: 중복 product_id 건너뛰기
-- ============================================
LOAD DATA INFILE '/var/lib/mysql/product_lf.csv'
IGNORE
INTO TABLE Product
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
ESCAPED BY ''
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

-- FK 체크 다시 활성화
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 로드 결과 확인
-- ============================================
SELECT 'Country' AS table_name, COUNT(*) AS row_count FROM Country
UNION ALL
SELECT 'Category', COUNT(*) FROM Category
UNION ALL
SELECT 'Product', COUNT(*) FROM Product;

-- 국가별 상품 수
SELECT country_id, COUNT(*) AS product_count
FROM Product
GROUP BY country_id
ORDER BY product_count DESC;
