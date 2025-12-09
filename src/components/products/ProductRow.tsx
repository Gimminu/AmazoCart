import { useMemo } from 'react';
import { useProducts } from '../../hooks/useProducts';
import ProductCard from './ProductCard';
import SkeletonCard from './SkeletonCard';
import { groupByVariant } from '../../lib/variantKey';

interface Props { title: string; query?: Record<string, any>; }

export default function ProductRow({ title, query }: Props) {
  const { data, isLoading } = useProducts(query || { limit: 12, sort: 'popular' });
  const grouped = useMemo(() => groupByVariant(data || []), [data]);
  return (
    <section className="mb-6 bg-white rounded shadow-product p-3 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {isLoading && <div className="text-xs text-gray-500">로딩 중...</div>}
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
          : grouped?.map(({ representative, images, variants, variantCount }) => (
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
