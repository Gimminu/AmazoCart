-- 1. 주문 금액 자동 계산
DELIMITER //
CREATE TRIGGER trg_order_item_amount
BEFORE INSERT ON Order_Item
FOR EACH ROW
BEGIN
    -- amount 자동 계산
    SET NEW.amount = NEW.price_at_order * NEW.quantity;
END //
DELIMITER ;

-- 2. 장바구니 만료 자동 설정 
-- 7일로 설정 
-- 얼마든지 설정 가능
DELIMITER //
CREATE TRIGGER trg_cart_expires
BEFORE INSERT ON Cart
FOR EACH ROW
BEGIN
    -- 생성일로부터 7일 후 만료
    IF NEW.expires_at IS NULL THEN
        SET NEW.expires_at = DATE_ADD(NEW.created_at, INTERVAL 7 DAY);
    END IF;
END //
DELIMITER ;

-- 3. 주문 완료 시 장바구니 비활성화 
-- 재주문 되면, 안됨..
-- 시스템 설정마다 다르겠으나, 본 프로젝트에서는 
-- 비활성화로 설정
DELIMITER //
CREATE TRIGGER trg_order_deactivate_cart
AFTER INSERT ON Orders
FOR EACH ROW
BEGIN
    UPDATE Cart 
    SET is_active = FALSE 
    WHERE user_id = NEW.user_id AND is_active = TRUE;
END //
DELIMITER ;

