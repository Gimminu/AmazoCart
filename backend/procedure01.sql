-- 주문 order 취소시 프로시저 작동
-- 원자성 Atomicity 
-- All or Nothing 충족
-- 프로시저 없으면, 중간에 실패시 데이터 불일치
-- call sp_cancel_order(p_order_id);
DELIMITER //
CREATE PROCEDURE sp_cancel_order(IN p_order_id VARCHAR(50))
BEGIN
    START TRANSACTION;
    
    -- 주문 상태 변경
    UPDATE Orders SET status = 'cancelled' WHERE order_id = p_order_id;
    
    COMMIT;
    
    SELECT '주문 취소됨' AS result, p_order_id AS order_id;
END //
DELIMITER ;