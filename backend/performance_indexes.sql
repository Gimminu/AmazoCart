USE amazon_db;

-- Drop legacy/duplicate indexes first to avoid "Duplicate key name" and ensure
-- the optimized composites take effect.
set FOREIGN_KEY_CHECKS=0;
ALTER TABLE Product DROP INDEX IF EXISTS ft_product_name;
ALTER TABLE Product DROP INDEX IF EXISTS idx_product_sort_popular;
ALTER TABLE Product DROP INDEX IF EXISTS idx_product_price;
ALTER TABLE Product DROP INDEX IF EXISTS idx_product_price_sort;
ALTER TABLE Product DROP INDEX IF EXISTS idx_product_rating_sort;
ALTER TABLE Product DROP INDEX IF EXISTS idx_product_category;
ALTER TABLE Product DROP INDEX IF EXISTS idx_product_category_popular;
ALTER TABLE Category DROP INDEX IF EXISTS idx_category_name_country;
ALTER TABLE Cart_Item DROP INDEX IF EXISTS idx_cart_item_cart_product;
ALTER TABLE Orders DROP INDEX IF EXISTS idx_orders_user_created;

-- 1) Full-text search on product_name for MATCH() queries
ALTER TABLE Product
  ADD FULLTEXT INDEX ft_product_name (product_name);

-- 2) Popular sorting (review_count, rating) for default listings
CREATE INDEX idx_product_sort_popular
  ON Product (review_count, rating, product_id);

-- 3) Price sorting with stable tie-breaker
CREATE INDEX idx_product_price_sort
  ON Product (price, product_id);

-- 4) Rating sorting (rating, review_count) with stable tie-breaker
CREATE INDEX idx_product_rating_sort
  ON Product (rating, review_count, product_id);

-- 5) Category + country filters with popular ordering
ALTER TABLE Product ADD INDEX idx_product_category_popular
  (category_id, country_id, review_count, rating, product_id);

-- 6) Fast category lookup by name during filter resolution
ALTER TABLE Category ADD INDEX idx_category_name_country (category, country_id);

-- 7) Cart item lookups/UPSERT by cart+product
ALTER TABLE Cart_Item ADD INDEX idx_cart_item_cart_product (cart_id, product_id);

-- 8) Order history by user ordered by created_at
ALTER TABLE Orders ADD INDEX idx_orders_user_created (user_id, created_at);

-- Optional: if you frequently filter only by country
-- CREATE INDEX idx_product_country ON Product (country_id, product_id);

set FOREIGN_KEY_CHECKS=1;
