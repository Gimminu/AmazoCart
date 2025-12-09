-- 주문 상태 변경
DELIMITER //
CREATE PROCEDURE sp_update_order_status(
    IN p_order_id VARCHAR(50),
    IN p_status VARCHAR(20)
)
BEGIN
    UPDATE Orders SET status = p_status WHERE order_id = p_order_id;
    SELECT order_id, status FROM Orders WHERE order_id = p_order_id;
END //
DELIMITER ;

-- 사용: CALL sp_update_order_status('ORD-20241203-002', 'shipped');