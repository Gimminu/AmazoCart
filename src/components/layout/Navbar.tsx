import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../hooks/useCategories';
import { LANGUAGE_OPTIONS } from '../../constants/countries';
import { useUserRegion } from '../../hooks/useUserRegion';
import { REGIONS } from '../../constants/regions';

export default function Navbar() {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  const regionMenuRef = useRef<HTMLDivElement>(null);
  const { country, setCountry } = useUserRegion();
  const { data: categories } = useCategories();
  const selectedRegion = REGIONS.find((region) => region.id === country) || REGIONS[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = keyword.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(e.target.value);
  };

  const resolveCategorySlug = (label: string) => {
    if (!categories) return null;
    const found = categories.find(
      (c) =>
        c.category?.toLowerCase() === label.toLowerCase() ||
        c.slug?.toLowerCase() === label.toLowerCase()
    );
    return found?.slug || found?.category || null;
  };

  const goCategory = (label: string) => {
    setOpenDrawer(false);
    const slug = resolveCategorySlug(label) || label;
    navigate(`/category/${encodeURIComponent(slug)}`);
  };

  const apiCategories =
    categories
      ?.filter(c => (c.product_count ?? 0) > 0)
      .sort((a, b) => (b.product_count || 0) - (a.product_count || 0))
      .slice(0, 10)
      .map(c => c.category) || [];

  type DrawerItem = { label: string; type: 'search' | 'category'; value: string };
  const drawerSections: { title: string; items: DrawerItem[] }[] = [
    {
      title: 'Trending',
      items: [
        { label: 'Best Sellers', type: 'search', value: 'best seller' },
        { label: 'New Releases', type: 'search', value: 'new release' },
        { label: 'Movers and Shakers', type: 'search', value: 'trending' }
      ]
    },
    {
      title: 'Digital Content',
      items: [
        { label: 'Echo & Alexa', type: 'search', value: 'echo alexa' },
        { label: 'Fire TV', type: 'search', value: 'fire tv' },
        { label: 'Kindle', type: 'search', value: 'kindle' },
        { label: 'Amazon Prime Video', type: 'search', value: 'prime video' },
        { label: 'Audible', type: 'search', value: 'audible' },
        { label: 'Amazon Music', type: 'search', value: 'amazon music' }
      ]
    },
    {
      title: 'Shop by Category',
      items: [
        ...apiCategories.map(c => ({ label: c, type: 'category' as const, value: c }))
      ]
    }
  ];

  const brandBg = '#531525ff'; // burgundy
  const subBg = '#8c2a44'; // lighter burgundy
  const borderColor = '#0f4c3a'; // dark green accent

  const dynamicTop = apiCategories.slice(0, 4).map((c) => ({
    label: c,
    type: 'category' as const,
    value: c
  }));
  const topNavLinks: { label: string; type: 'category' | 'search'; value: string }[] = [
    { label: 'Best Sellers', type: 'search', value: 'best seller' },
    ...dynamicTop,
    { label: 'Deals', type: 'search', value: 'deal' }
  ];

  const handleTopNav = (link: { type: 'category' | 'search'; value: string }) => {
    if (link.type === 'category') {
      goCategory(link.value);
    } else {
      navigate(`/search?q=${encodeURIComponent(link.value)}`);
    }
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (regionMenuRef.current && !regionMenuRef.current.contains(event.target as Node)) {
        setRegionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleRegionSelect = (id: string) => {
    setCountry(id);
    setRegionMenuOpen(false);
  };

  return (
    <header className="w-full text-white text-xs sm:text-[13px] shadow-md z-20 border-b-2" style={{ borderColor }}>
      {/* Top bar */}
      <div className="w-full px-3 py-2 flex items-center gap-3 flex-wrap" style={{ backgroundColor: brandBg }}>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button className="text-lg" onClick={() => setOpenDrawer(true)}>☰</button>
          <Link to="/" className="text-lg font-bold tracking-tight mr-1 flex items-center gap-1">
            <span className="text-amazonYellow">Amazo</span>Cart
          </Link>
          <div className="hidden sm:flex flex-col leading-tight relative" ref={regionMenuRef}>
            <button
              onClick={() => setRegionMenuOpen((prev) => !prev)}
              className="text-left"
            >
              <span className="text-[11px] text-white/80">{t('nav.deliverTo')}</span>
              <span className="font-semibold text-white flex items-center gap-1">
                <span>{selectedRegion.flag}</span>
                {t(`regions.${selectedRegion.id}`)}
              </span>
            </button>
            {regionMenuOpen && (
              <div className="absolute top-full mt-1 bg-white text-black rounded shadow-lg z-40 w-48">
                {REGIONS.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionSelect(region.id)}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-panelGray ${region.id === selectedRegion.id ? 'font-semibold text-holidayBurgundy' : ''
                      }`}
                  >
                    <span>{region.flag}</span>
                    <span>{t(`regions.${region.id}`)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <form className="flex flex-1 min-w-[280px]" onSubmit={handleSearch}>
          <select className="bg-gray-100 text-black text-xs px-2 rounded-l border border-gray-200">
            <option>All</option>
          </select>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-3 py-[10px] text-black text-sm focus:outline-none border-t border-b border-gray-200"
            placeholder={t('nav.searchPlaceholder')}
          />
          <button className="bg-amazonYellow text-black px-4 rounded-r border border-gray-200" aria-label="search">
            🔍
          </button>
        </form>

        <div className="flex items-center gap-3 lg:ml-auto">
          <label className="flex items-center gap-1 text-[11px] text-gray-200">
            <span className="hidden md:inline">{t('nav.language')}:</span>
            <select
              value={i18n.language}
              onChange={handleLangChange}
              className="bg-white text-black text-xs px-2 py-1 rounded border border-white/30"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <Link to="/login" className="hover:text-amazonYellow whitespace-nowrap flex flex-col leading-tight">
            <span className="text-[11px] text-gray-300">{t('nav.hello')}</span>
            <span className="font-semibold">{user ? user.email : 'Account & Lists'}</span>
          </Link>
          <Link to="/orders" className="hidden sm:flex hover:text-amazonYellow whitespace-nowrap flex-col leading-tight">
            <span className="text-[11px] text-gray-300">Returns</span>
            <span className="font-semibold">& Orders</span>
          </Link>
          <Link to="/cart" className="relative hover:text-amazonYellow whitespace-nowrap font-semibold flex items-center">
            🛒 <span className="ml-1">{t('nav.cart')}</span>
          </Link>
        </div>
      </div>

      {openDrawer && (
        <div className="fixed inset-0 bg-black/50 z-30 flex">
          <div
            className="bg-white text-black w-[320px] h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-amazonDark text-white">
              <span className="font-semibold">{user ? user.email : 'Hello, sign in'}</span>
              <button onClick={() => setOpenDrawer(false)} className="text-sm">✕</button>
            </div>
            <div className="px-4 py-3 space-y-4">
              {drawerSections.map(sec => (
                <div key={sec.title} className="border-b pb-3">
                  <h4 className="font-semibold mb-2">{sec.title}</h4>
                  <ul className="space-y-1 text-sm">
                    {sec.items.map(item => (
                      <li key={item.label}>
                        <button
                          onClick={() => {
                            if (item.type === 'category') {
                              goCategory(item.value);
                            } else {
                              setOpenDrawer(false);
                              navigate(`/search?q=${encodeURIComponent(item.value)}`);
                            }
                          }}
                          className="hover:text-holidayBurgundy cursor-pointer w-full text-left"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setOpenDrawer(false)} />
        </div>
      )}
    </header>
  );
}
