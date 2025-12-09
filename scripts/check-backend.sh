#!/bin/bash

# AmazoCart 백엔드 상태 확인 및 진단 스크립트

echo "========================================"
echo "AmazoCart Backend 진단 도구"
echo "========================================"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. MariaDB 상태 확인
echo -e "${YELLOW}[1] MariaDB 서비스 상태 확인...${NC}"
if systemctl is-active --quiet mariadb; then
  echo -e "${GREEN}✓ MariaDB 서비스 실행 중${NC}"
else
  echo -e "${RED}✗ MariaDB 서비스 실행 안 됨${NC}"
  echo "  시작 명령: sudo systemctl start mariadb"
fi
echo ""

# 2. 데이터베이스 연결 테스트
echo -e "${YELLOW}[2] 데이터베이스 연결 테스트...${NC}"
if mysql -h 127.0.0.1 -u root -p'' amazon_db -e "SELECT COUNT(*) as product_count FROM Product LIMIT 1;" 2>/dev/null | grep -q "product_count"; then
  count=$(mysql -h 127.0.0.1 -u root -p'' amazon_db -e "SELECT COUNT(*) FROM Product;" 2>/dev/null | tail -1)
  echo -e "${GREEN}✓ 데이터베이스 연결 성공${NC}"
  echo "  상품 수: $count"
else
  echo -e "${RED}✗ 데이터베이스 연결 실패${NC}"
  echo "  확인 사항:"
  echo "    - MariaDB가 실행 중인가?"
  echo "    - amazon_db 데이터베이스가 존재하는가?"
  echo "    - 접속 권한이 있는가? (계정: root, 비밀번호: 없음)"
fi
echo ""

# 3. 백엔드 프로세스 확인
echo -e "${YELLOW}[3] 백엔드 프로세스 확인...${NC}"
if pgrep -f "node.*server.js" > /dev/null; then
  pid=$(pgrep -f "node.*server.js")
  echo -e "${GREEN}✓ 백엔드 실행 중 (PID: $pid)${NC}"
  
  # 메모리 사용량
  memory=$(ps -p $pid -o %mem= | awk '{print $1}')
  echo "  메모리 사용률: $memory%"
else
  echo -e "${YELLOW}⚠ 백엔드 미실행${NC}"
fi
echo ""

# 4. 포트 확인
echo -e "${YELLOW}[4] 포트 3004 상태 확인...${NC}"
if netstat -ln 2>/dev/null | grep -q ":3004 "; then
  echo -e "${GREEN}✓ 포트 3004 수신 중${NC}"
else
  echo -e "${YELLOW}⚠ 포트 3004가 수신 중이지 않음${NC}"
fi
echo ""

# 5. Health Check API
echo -e "${YELLOW}[5] Health Check API 테스트...${NC}"
if command -v curl &> /dev/null; then
  response=$(curl -s http://localhost:3004/api/health 2>/dev/null)
  if [ -n "$response" ]; then
    echo -e "${GREEN}✓ API 응답 확인${NC}"
    echo "  응답: $response" | head -c 100
    echo ""
  else
    echo -e "${RED}✗ API 응답 없음 (서버가 실행 중이지 않거나 응답하지 않음)${NC}"
  fi
else
  echo "curl 명령어 없음 - API 테스트 생략"
fi
echo ""

# 6. 로그 파일 확인
echo -e "${YELLOW}[6] 최근 에러 로그 확인...${NC}"
if [ -f "/home/minu/web/AmazoCart/backend/server.log" ]; then
  echo "최근 10줄:"
  tail -10 /home/minu/web/AmazoCart/backend/server.log
else
  echo "로그 파일이 없습니다."
fi
echo ""

echo "========================================"
echo "진단 완료"
echo "========================================"
echo ""
echo "백엔드 시작 명령:"
echo "  cd /home/minu/web/AmazoCart/backend"
echo "  npm install   # 처음만"
echo "  npm start"
echo ""
echo "로그 확인 명령:"
echo "  tail -f /home/minu/web/AmazoCart/backend/server.log"
echo ""
