CREATE OR REPLACE VIEW Product_US AS
SELECT
    product_id,
    product_name,
    price,
    image,
    rating,
    review_count,
    category_id,
    country_id
FROM Product
WHERE
    country_id = 'US';

CREATE OR REPLACE VIEW Product_UK AS
SELECT
    product_id,
    product_name,
    price,
    image,
    rating,
    review_count,
    category_id,
    country_id
FROM Product
WHERE
    country_id = 'UK';

CREATE OR REPLACE VIEW Product_CA AS
SELECT
    product_id,
    product_name,
    price,
    image,
    rating,
    review_count,
    category_id,
    country_id
FROM Product
WHERE
    country_id = 'CA';

CREATE OR REPLACE VIEW Product_IN AS
SELECT
    product_id,
    product_name,
    price,
    image,
    rating,
    review_count,
    category_id,
    country_id
FROM Product
WHERE
    country_id = 'IN';