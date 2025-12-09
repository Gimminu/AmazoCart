import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from './ProductCard';
import SkeletonCard from './SkeletonCard';
import { useTranslation } from 'react-i18next';
import { groupByVariant } from '../../lib/variantKey';
import { fetchPopularProducts } from '../../lib/api';
import { useUserRegion } from '../../hooks/useUserRegion';

export default function BestSellerRow() {
  const { country } = useUserRegion();
  const { data, isLoading } = useQuery({
    queryKey: ['popular', country, 30],
    queryFn: () => fetchPopularProducts({ limit: 30, country }),
    staleTime: 10 * 60 * 1000
  });
  const { t } = useTranslation();

  const bestSellers = useMemo(() => {
    if (!data || data.length === 0) return [];
    return groupByVariant(data).slice(0, 12);
  }, [data]);

  return (
    <section className="mb-6 bg-white rounded shadow-product p-3 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{t('common.bestSellers')}</h3>
        {isLoading && <div className="text-xs text-gray-500">{t('common.loading')}</div>}
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`sk-bs-${i}`} />)
          : bestSellers.map(({ representative, images, variants, variantCount }) => (
            <ProductCard
              key={representative.product_id}
              product={representative}
              variantImages={images}
              variantProducts={[representative, ...variants]}
              variantCount={variantCount}
            />
          ))}
      </div>
    </section>
  );
}
