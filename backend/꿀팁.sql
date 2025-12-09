-- 베스트셀러 (주문 많은 상품)
SELECT 
    oi.product_name,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.amount) AS total_revenue
FROM Order_Item oi
GROUP BY oi.product_id
ORDER BY total_sold DESC
LIMIT 10;

-- 고객별 총 주문금액
SELECT 
    u.name,
    COUNT(o.order_id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM `User` u
LEFT JOIN Orders o ON u.user_id = o.user_id
GROUP BY u.user_id;