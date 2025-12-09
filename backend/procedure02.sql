-- 트랜잭션 
-- 장바구니에서 주문으로 자동 전환!! 
-- 자동으로 넘어가게 된다. 

-- 사용법
-- CALL sp_checkout(1, 'ORD-20241203-001', '서울시 강남구 123', 'KR');
-- 주무내역으로 자동으로 넘어가며, 장바구니에 들어간 상품 제거 + 장바구니 비활성화

DROP PROCEDURE IF EXISTS sp_checkout;

DELIMITER //
CREATE PROCEDURE sp_checkout(
    IN p_user_id INT,
    IN p_order_id VARCHAR(50),
    IN p_address TEXT,
    IN p_shipping_country VARCHAR(100)
)
BEGIN
    DECLARE v_total DECIMAL(12,2);
    DECLARE v_cart_id INT;
    
    START TRANSACTION;
    
    -- 1. 활성 장바구니 ID 저장
    SELECT cart_id INTO v_cart_id
    FROM Cart
    WHERE user_id = p_user_id AND is_active = TRUE
    LIMIT 1;
    
    -- 2. 총 금액 계산
    SELECT SUM(p.price * ci.quantity) INTO v_total
    FROM Cart_Item ci
    JOIN Product p ON ci.product_id = p.product_id
    WHERE ci.cart_id = v_cart_id;
    
    -- 3. 주문 상품 먼저 임시 저장 (트리거 전에!)
    CREATE TEMPORARY TABLE temp_order_items AS
    SELECT 
        p.product_id,
        ci.quantity,
        p.price AS price_at_order,
        (p.price * ci.quantity) AS amount,
        p.product_name
    FROM Cart_Item ci
    JOIN Product p ON ci.product_id = p.product_id
    WHERE ci.cart_id = v_cart_id;
    
    -- 4. 주문 생성 (여기서 트리거 발동)
    INSERT INTO Orders (order_id, user_id, shipping_country, created_at, total_amount, status, address)
    VALUES (p_order_id, p_user_id, p_shipping_country, CURRENT_DATE, v_total, 'pending', p_address);
    
    -- 5. 임시 테이블에서 Order_Item으로 복사
    INSERT INTO Order_Item (order_id, product_id, quantity, price_at_order, amount, product_name)
    SELECT p_order_id, product_id, quantity, price_at_order, amount, product_name
    FROM temp_order_items;
    
    -- 6. 임시 테이블 삭제
    DROP TEMPORARY TABLE temp_order_items;
    
    -- 7. 장바구니 아이템 삭제
    DELETE FROM Cart_Item WHERE cart_id = v_cart_id;
    
    COMMIT;
    
    SELECT '주문 완료' AS result, p_order_id AS order_id, v_total AS total_amount;
END //
DELIMITER ;