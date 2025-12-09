import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';
import SkeletonCard from '../components/products/SkeletonCard';
import { useCategories } from '../hooks/useCategories';
import { useTranslation } from 'react-i18next';
import Pagination from '../components/common/Pagination';
import { groupByVariant } from '../lib/variantKey';
import { useUserRegion } from '../hooks/useUserRegion';

export default function Category() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const decodedSlug = name ? decodeURIComponent(name) : '';
  const [sort, setSort] = useState('popular');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [dealFilter, setDealFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20; // smaller page for faster response
  const { data: categoryList } = useCategories();
  const { country } = useUserRegion();
  const { t } = useTranslation();
  const sortOptions = [
    { value: 'popular', label: t('filters.popular') },
    { value: 'rating', label: t('filters.rating') },
    { value: 'price-low', label: t('filters.priceLow') },
    { value: 'price-high', label: t('filters.priceHigh') },
    { value: 'newest', label: t('filters.newest') }
  ];

  const queryParams = useMemo(
    () => ({
      category: decodedSlug,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      sort,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      q: keyword || undefined
    }),
    [decodedSlug, sort, minPrice, maxPrice, keyword, page]
  );

  const { data, isLoading } = useProducts(queryParams);
  const filtered = data?.filter(p => (p.avg_rating ?? 0) >= ratingFilter) || [];
  // 전체 데이터 길이는 서버 페이징 결과를 사용해 페이지네이션 판단
  const productCount = data?.length || 0;
  const matchedCategory = categoryList?.find(
    (c) => c.slug === decodedSlug || c.category === decodedSlug
  );
  const categoryLabel =
    matchedCategory?.category || decodedSlug.replace(/-/g, ' ') || '전체';

  const departments = useMemo(() => {
    if (!categoryList) return [];
    const sorted = [...categoryList].sort((a, b) => (b.product_count || 0) - (a.product_count || 0));
    return sorted.slice(0, 12);
  }, [categoryList]);
  const dealFilters = [
    { id: 'all', label: t('categoryPage.dealFilters.all') },
    { id: 'today', label: t('categoryPage.dealFilters.today'), sort: 'popular' },
    { id: 'lightning', label: t('categoryPage.dealFilters.lightning'), sort: 'rating' },
    { id: 'tech', label: t('categoryPage.dealFilters.tech'), q: 'tech' },
    { id: 'home', label: t('categoryPage.dealFilters.home'), q: 'home' }
  ];

  // 카테고리/정렬/가격필터가 바뀌면 첫 페이지로 초기화
  useEffect(() => {
    setPage(1);
  }, [decodedSlug, sort, minPrice, maxPrice, ratingFilter]);

  const handleDealFilter = (id: string, sortVal?: string, qVal?: string) => {
    setDealFilter(id);
    if (sortVal) setSort(sortVal);
    if (qVal !== undefined) setKeyword(qVal);
    setPage(1);
  };

  const grouped = useMemo(() => groupByVariant(filtered), [filtered]);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded shadow-product p-4 space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {t('category')}: {categoryLabel || t('categories')}
            </h1>
            <p className="text-sm text-gray-600">{t('categoryPage.results', { count: productCount })}</p>
            <p className="text-xs text-gray-500">
              {t('categoryPage.deliverTo', { country: t(`regions.${country}`) })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="font-medium text-gray-700">{t('filters.sort')}:</span>
            <div className="flex flex-wrap gap-1">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`px-2 py-1 rounded-full border text-xs ${sort === opt.value ? 'bg-holidayBurgundy text-white border-holidayBurgundy' : 'bg-white text-gray-800 border-gray-300 hover:border-holidayBurgundy'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1 bg-panelGray px-2 py-1 rounded ml-2">
              {t('filters.min')}
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                type="number"
                className="w-20 text-black text-sm rounded px-2 py-[2px] border"
                placeholder="0"
              />
            </label>
            <label className="flex items-center gap-1 bg-panelGray px-2 py-1 rounded">
              {t('filters.max')}
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                type="number"
                className="w-20 text-black text-sm rounded px-2 py-[2px] border"
                placeholder="999999"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {dealFilters.map(df => (
            <button
              key={df.id}
              onClick={() => handleDealFilter(df.id, df.sort, df.q)}
              className={`px-3 py-1 rounded-full border ${dealFilter === df.id ? 'bg-holidayBurgundy text-white border-holidayBurgundy' : 'bg-white text-gray-800 border-gray-300 hover:border-holidayBurgundy'}`}
            >
              {df.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3">
        <aside className="bg-white rounded shadow-product p-3 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{t('categoryPage.departments')}</h4>
            <ul className="space-y-1 text-sm">
              {departments.map(dep => (
                <li key={dep.category_id}>
                  <button
                    onClick={() => navigate(`/category/${encodeURIComponent(dep.slug || dep.category)}`)}
                    className="hover:text-holidayBurgundy text-left w-full"
                  >
                    {dep.category}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('categoryPage.ratingFilter')}</h4>
            {[4, 3, 2, 0].map(r => (
              <button
                key={r}
                onClick={() => setRatingFilter(r)}
                className={`block w-full text-left px-2 py-1 rounded border mb-1 ${ratingFilter === r ? 'bg-holidayBurgundy text-white border-holidayBurgundy' : 'bg-white text-gray-800 border-gray-300 hover:border-holidayBurgundy'}`}
              >
                {r === 0 ? t('categoryPage.allRatings') : `${r}★ & up`}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">{t('categoryPage.keyword')}</h4>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="예: watch, laptop"
            />
          </div>
        </aside>

        <section>
          {isLoading && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
            </div>
          )}
          {!isLoading && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
              {grouped.map(({ representative, images, variantCount }) => (
                <ProductCard
                  key={representative.product_id}
                  product={representative}
                  variants={images}
                  variantCount={variantCount}
                />
              ))}
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="mt-4 text-sm text-gray-700 bg-white rounded p-3 shadow-product">
              {t('search.empty')} <a className="text-amazonBlue hover:underline" href="/categories">{t('categoriesPage.title')}</a>
            </div>
          )}
          {!isLoading && filtered.length > 0 && (
            <Pagination
              page={page}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              disablePrev={page === 1}
              disableNext={(data?.length || 0) < pageSize}
              label={t('pagination.showing', { count: grouped.length, size: pageSize })}
            />
          )}
        </section>
      </div>
    </div>
  );
}
