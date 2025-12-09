import { Link, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';

export default function Header() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="bg-amazonNavy text-white">
      <div className="flex items-center gap-6 px-4 py-3 max-w-[1400px] mx-auto">
        <Link to="/" className="text-xl font-bold tracking-tight">
          <span className="text-amazonYellow">Amazo</span>Cart
        </Link>
        <form onSubmit={handleSearch} className="flex flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="flex-1 px-3 py-2 rounded-l text-black focus:outline-none"
          />
          <button className="bg-amazonYellow text-black px-4 rounded-r font-medium">검색</button>
        </form>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/cart" className="hover:underline">장바구니</Link>
        </nav>
      </div>
      <div className="bg-amazonDark text-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-2 flex gap-4 overflow-x-auto">
          {['Electronics','Clothing','Books','Home & Garden','Sports'].map(c => (
            <Link key={c} to={`/category/${encodeURIComponent(c)}`} className="whitespace-nowrap hover:text-amazonYellow">
              {c}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
