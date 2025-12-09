-- 자주 사용할 것 같은 쿼리문 뷰로 생성
-- 사용자의 주문 상세 뷰
-- 01 사용: SELECT * FROM v_order_details WHERE customer_name = '정선재';
-- 02 사용: SELECT * FROM v_order_details;
CREATE VIEW v_order_details AS
SELECT 
    o.order_id,
    u.name AS customer_name,
    o.created_at,
    o.status,
    o.total_amount,
    o.address,
    oi.product_name,
    oi.quantity,
    oi.price_at_order,
    oi.amount
FROM Orders o
JOIN `User` u ON o.user_id = u.user_id
JOIN Order_Item oi ON o.order_id = oi.order_id;

-- 국가별 상품 통계 뷰
-- 전체 상품 조회하는 뷰로, 결과까지는 오래 걸림.
/*+----------------+---------------+-------------+------------+
결과는 이럼. 
| country        | product_count | avg_price   | avg_rating |
+----------------+---------------+-------------+------------+
| Canada         |       1882853 |  118.091127 |    2.38278 |
| India          |       1563194 | 2474.053762 |    1.94767 |
| United Kingdom |       2168176 |   95.252767 |    1.97475 |
| United States  |       1426337 |   43.375404 |    3.99951 |
결과 나오는데 4 rows in set (3 min 49.756 sec)
약 4분정도 걸림
+----------------+---------------+-------------+------------+*/
CREATE VIEW v_product_stats AS
SELECT 
    c.country,
    COUNT(*) AS product_count,
    AVG(p.price) AS avg_price,
    AVG(p.rating) AS avg_rating
FROM Product p
JOIN Country c ON p.country_id = c.country_id
GROUP BY c.country_id;