import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { user, loginWithEmail, logout } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await loginWithEmail(email, name);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded shadow-product p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t('login.title')}</h1>
      </header>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t('login.email')}</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-700">{t('login.name')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="홍길동"
          />
        </div>
        <button
          disabled={loading}
          className="w-full bg-amazonYellow hover:bg-amazonOrange text-black font-medium py-2 rounded disabled:opacity-60"
        >
          {loading ? '...' : t('login.submit')}
        </button>
      </form>

      <div className="text-sm text-gray-700 space-y-2">
        <div>회원가입, 비밀번호 재설정, 소셜 로그인은 추후 Auth API 연동 시 활성화됩니다.</div>
        <Link to="/orders" className="text-amazonBlue hover:underline">주문내역으로 이동</Link>
        {user && (
          <button onClick={logout} className="text-red-600 hover:underline block">{t('login.logout')}</button>
        )}
      </div>
    </div>
  );
}
