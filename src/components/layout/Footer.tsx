export default function Footer() {
  return (
    <footer className="bg-amazonDark text-white mt-10">
      <div className="max-w-[1400px] mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
        <div>
          <h4 className="font-semibold mb-2">AmazoCart 소개</h4>
          <ul className="space-y-1">
            <li>프로젝트 개요</li>
            <li>데이터 모델</li>
            <li>API 구조</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">쇼핑</h4>
          <ul className="space-y-1">
            <li>전자제품</li>
            <li>의류</li>
            <li>도서</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">고객 지원</h4>
          <ul className="space-y-1">
            <li>문의하기</li>
            <li>주문 추적</li>
            <li>반품 정책</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">플랫폼</h4>
          <ul className="space-y-1">
            <li>React + Vite</li>
            <li>Express + SQLite</li>
            <li>TailwindCSS</li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs py-4 bg-amazonNavy">© {new Date().getFullYear()} AmazoCart</div>
    </footer>
  );
}
