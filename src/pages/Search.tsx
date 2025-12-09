import { useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';
import SkeletonCard from '../components/products/SkeletonCard';
import { useTranslation } from 'react-i18next';
import Pagination from '../components/common/Pagination';
import { groupByVariant } from '../lib/variantKey';
import { useQuery } from '@tanstack/react-query';
import { fetchPopularProducts } from '../lib/api';
import { useUserRegion } from '../hooks/useUserRegion';

const BEST_SELLER_TERMS = [
  'best seller',
  'best sellers',
  'bestseller',
  'bestsellers',
  'best-selling',
  'best selling',
  'top seller',
  'top sellers',
  'popular items',
  '인기 상품',
  '베스트셀러',
  '베스트 셀러'
];

function useQueryParam(name: string) {
  const params = new URLSearchParams(useLocation().search);
  return params.get(name) || '';
}

export default function Search() {
  const q = useQueryParam('q').trim();
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const normalizedQuery = q.toLowerCase().replace(/\s+/g, ' ').trim();
  const isBestSeller = BEST_SELLER_TERMS.includes(normalizedQuery);
  const { country } = useUserRegion();
  const queryParams = useMemo(
    () => ({ q, sort, limit: pageSize, offset: (page - 1) * pageSize }),
    [q, sort, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [q, sort]);
  const isQueryReady = Boolean(q);
  const { data, isLoading } = useProducts(queryParams, { enabled: isQueryReady && !isBestSeller });
  const { data: popularData, isLoading: isPopularLoading } = useQuery({
    queryKey: ['popular-search', country, pageSize],
    queryFn: () => fetchPopularProducts({ limit: pageSize, country }),
    enabled: isQueryReady && isBestSeller,
    staleTime: 10 * 60 * 1000
  });
  const effectiveData = isBestSeller ? popularData : data;
  const effectiveLoading = isBestSeller ? isPopularLoading : isLoading;
  const grouped = useMemo(() => groupByVariant(effectiveData || []), [effectiveData]);
  const { t } = useTranslation();
  const sortOptions = [
    { value: 'popular', label: t('filters.popular') },
    { value: 'rating', label: t('filters.rating') },
    { value: 'price-low', label: t('filters.priceLow') },
    { value: 'price-high', label: t('filters.priceHigh') },
    { value: 'newest', label: t('filters.newest') }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded shadow-product p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('search.title', { q: q || t('search.hint') })}</h1>
          <p className="text-sm text-gray-600">{t('search.hint')}</p>
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
        </div>
      </div>

      {!isQueryReady && <div className="text-sm text-gray-700">{t('search.hint')}</div>}
      {isQueryReady && effectiveLoading && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
        </div>
      )}
      {isQueryReady && !effectiveLoading && (
        <>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {grouped?.map(({ representative, images, variants, variantCount }) => (
              <ProductCard
                key={representative.product_id}
                product={representative}
                variantImages={images}
                variantProducts={[representative, ...variants]}
                variantCount={variantCount}
              />
            ))}
          </div>
          {!effectiveLoading && grouped?.length === 0 && <div>{t('search.empty')}</div>}
          {!effectiveLoading && grouped && grouped.length > 0 && (
            <Pagination
              page={page}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              disablePrev={page === 1}
              disableNext={grouped.length < pageSize}
              label={t('pagination.showing', { count: grouped.length, size: pageSize })}
            />
          )}
        </>
      )}
    </div>
  );
}
