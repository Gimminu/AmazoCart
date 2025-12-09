-- ============================================
-- Amazon E-Commerce Database DDL (MariaDB)
-- Updated: Category 테이블에 country_id 추가
-- ============================================

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS amazon_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;
    

-- 데이터베이스 선택
USE amazon_db;

-- ============================================
-- 테이블 생성
-- ============================================

-- 1. Country 테이블 (참조되는 테이블이므로 먼저 생성)
CREATE TABLE Country (
    country_id VARCHAR(10) PRIMARY KEY,
    country VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    monetary VARCHAR(10) NOT NULL
) ENGINE=InnoDB;

-- 2. Category 테이블 (country_id FK 추가)
CREATE TABLE Category (
    category_id INT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    country_id VARCHAR(10) NOT NULL,
    FOREIGN KEY (country_id) REFERENCES Country (country_id),
    UNIQUE (category_id, country_id)
) ENGINE=InnoDB;

-- 3. User 테이블
CREATE TABLE `User` (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    UNIQUE (name),
    UNIQUE (email)
) ENGINE=InnoDB;

-- 4. Product 테이블
CREATE TABLE Product (
    product_id VARCHAR(20) PRIMARY KEY,
    product_name VARCHAR(2000) NOT NULL,
    image VARCHAR(2048),
    price DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(2, 1),
    review_count INT DEFAULT 0,
    country_id VARCHAR(10) NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (country_id) REFERENCES Country (country_id),
    FOREIGN KEY (category_id, country_id) REFERENCES Category (category_id, country_id)
) ENGINE=InnoDB;

-- 5. Cart 테이블
CREATE TABLE Cart (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    cart_name VARCHAR(40),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATE DEFAULT CURRENT_DATE,
    expires_at DATE,
    FOREIGN KEY (user_id) REFERENCES `User` (user_id)
) ENGINE=InnoDB;

-- 6. Cart_Item 테이블
CREATE TABLE Cart_Item (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (cart_id) REFERENCES Cart (cart_id),
    FOREIGN KEY (product_id) REFERENCES Product (product_id)
) ENGINE=InnoDB;

-- 7. Orders 테이블
CREATE TABLE Orders (
    order_id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    shipping_country VARCHAR(100),
    created_at DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    address TEXT,
    FOREIGN KEY (user_id) REFERENCES `User` (user_id)
) ENGINE=InnoDB;

-- 8. Order_Item 테이블
CREATE TABLE Order_Item (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_order DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    product_name VARCHAR(2000),
    FOREIGN KEY (order_id) REFERENCES Orders (order_id),
    FOREIGN KEY (product_id) REFERENCES Product (product_id)
) ENGINE=InnoDB;

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

-- Product 테이블 인덱스
CREATE INDEX idx_product_country ON Product (country_id);
CREATE INDEX idx_product_category ON Product (category_id);
CREATE INDEX idx_product_price ON Product (price);
CREATE INDEX idx_product_rating ON Product (rating);

-- Category 테이블 인덱스
CREATE INDEX idx_category_country ON Category (country_id);

-- Cart 테이블 인덱스
CREATE INDEX idx_cart_user ON Cart (user_id);
CREATE INDEX idx_cart_active ON Cart (is_active);

-- Orders 테이블 인덱스
CREATE INDEX idx_orders_user ON Orders (user_id);
CREATE INDEX idx_orders_status ON Orders (status);
CREATE INDEX idx_orders_created ON Orders (created_at);

-- Order_Item 테이블 인덱스
CREATE INDEX idx_orderitem_order ON Order_Item (order_id);
CREATE INDEX idx_orderitem_product ON Order_Item (product_id);
