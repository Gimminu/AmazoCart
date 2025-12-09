-- 이벤트 스케줄러
SET GLOBAL event_scheduler = ON;

-- 매일 자정에 오래된 장바구니 삭제
CREATE EVENT ev_cleanup_old_carts
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
    DELETE FROM Cart 
    WHERE is_active = FALSE 
    AND created_at < DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);