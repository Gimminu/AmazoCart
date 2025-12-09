import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchProduct, fetchProductVariants } from '../lib/api';
import { Product } from '../types/Product';
import SkeletonCard from '../components/products/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { useTranslation } from 'react-i18next';
import { useUserRegion } from '../hooks/useUserRegion';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

function describeVariant(name: string) {
  const packMatch = name.match(/(\d+)\s*(?:pack|count)/i);
  const sizeMatch = name.match(/\b(aaa?|aa|9v|cr2032|c|d)\b/i);
  const sizeLabel = sizeMatch ? sizeMatch[1].toUpperCase() : null;
  const packLabel = packMatch ? `${packMatch[1]} pack` : null;
  const tokens = [packLabel, sizeLabel].filter(Boolean);
  return tokens.join(' · ') || name.slice(0, 60);
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const stateVariants = (location.state as any)?.variantGroup as Product[] | undefined;
  const { country } = useUserRegion();
  const { format } = useCurrencyFormatter();
  const { data, isLoading, error } = useQuery<Product>({
    queryKey: ['product', id, country],
    queryFn: () => fetchProduct(id!, country)
  });
  const { data: variantResp } = useQuery<{ variants: Product[] }>({
    queryKey: ['variants', id, country],
    queryFn: () => fetchProductVariants(id!, country),
    enabled: Boolean(id)
  });
  const variants = variantResp?.variants ?? [];
  const { user } = useAuth();
  const { addMutation } = useCart(user?.user_id);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const variantList = useMemo(() => {
    const combined = [
      ...(stateVariants || []),
      ...(data ? [data] : []),
      ...variants
    ];
    const unique = new Map<string, Product>();
    for (const item of combined) {
      if (country && item.country_id && item.country_id !== country) continue;
      unique.set(item.product_id, item);
    }
    return Array.from(unique.values()).slice(0, 12);
  }, [variants, data, country]);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-8">
        <SkeletonCard />
        <div className="bg-white p-4 rounded shadow-product animate-pulse h-96" />
      </div>
    );
  }
  if (error || !data) return <div>{t('product.notFound')}</div>;

  const rating = data.avg_rating ?? 0;
  const reviewCount = data.review_count ?? 0;
  const categoryLabel = data.category_name || data.category || '카테고리 미정';
  const priceText = format(data.price);
  return (
    <div className="grid lg:grid-cols-[80px_1fr_320px] gap-6 items-start">
      <div className="hidden md:flex flex-col gap-3">
        {variantList.map((p) => {
          const active = p.product_id === data.product_id;
          const label = describeVariant(p.product_name);
          return (
            <button
              key={p.product_id}
              onClick={() => !active && navigate(`/product/${p.product_id}`)}
              className={`border rounded p-2 text-left hover:border-holidayBurgundy transition ${active ? 'border-holidayBurgundy shadow-sm' : 'border-gray-200'
                }`}
            >
              <img src={p.image} alt={p.product_name} className="w-full h-16 object-contain" />
              <div className="text-[11px] mt-1 line-clamp-2 leading-tight font-semibold">{label}</div>
              <div className="text-[11px] text-gray-600">{format(p.price)}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded shadow-product p-4 space-y-4">
        <div className="text-xs text-gray-500">
          Sponsored {categoryLabel}
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <img src={data.image} alt={data.product_name} className="w-full max-h-[480px] object-contain mx-auto" />
            {variantList.length > 1 && (
              <div className="md:hidden mt-3 flex gap-2 overflow-x-auto pb-1">
                {variantList.map((p) => {
                  const active = p.product_id === data.product_id;
                  const label = describeVariant(p.product_name);
                  return (
                    <button
                      key={`mobile-${p.product_id}`}
                      onClick={() => !active && navigate(`/product/${p.product_id}`)}
                      className={`min-w-[110px] border rounded p-2 text-left text-xs flex-shrink-0 ${active ? 'border-holidayBurgundy bg-holidayBurgundy/10' : 'border-gray-200'
                        }`}
                    >
                      <img src={p.image} alt={p.product_name} className="w-full h-16 object-contain" />
                      <div className="mt-1 font-semibold line-clamp-2">{label}</div>
                      <div className="text-gray-600">{format(p.price)}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-semibold">{data.product_name}</h1>
            <div className="text-sm text-gray-700">{t('product.category')}: {categoryLabel}</div>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span>{t('product.rating')} {rating}</span>
              <span className="text-gray-400">·</span>
              <span>{t('product.reviews')} {reviewCount}</span>
            </div>
            <div className="border border-holidayBurgundy/30 rounded p-3 bg-white/60">
              <div className="text-3xl font-bold text-black">{priceText}</div>
              <div className="text-sm text-green-700 font-semibold mt-1">In stock · Free delivery options</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-800">
              {['Free Delivery', 'Pay on Delivery', '7 days Replacement', '1 Year Warranty', 'Top Brand', 'Secure transaction'].map(label => (
                <div key={label} className="border rounded p-2 bg-white/70">{label}</div>
              ))}
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="font-semibold">About this item</div>
              <ul className="list-disc list-inside space-y-1">
                <li>High clarity display with bright output.</li>
                <li>All-day battery and smooth performance.</li>
                <li>Fast delivery and easy returns.</li>
              </ul>
            </div>

            {variantList.length > 1 && (
              <div className="border-t pt-3 mt-3 space-y-2">
                <div className="text-sm font-semibold">
                  {t('product.variants') || 'Variants'}
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {variantList.map((p) => {
                    const active = p.product_id === data.product_id;
                    const label = describeVariant(p.product_name);
                    return (
                      <button
                        key={p.product_id}
                        onClick={() => !active && navigate(`/product/${p.product_id}`)}
                        className={`flex items-center gap-2 border rounded p-2 text-left transition ${active ? 'border-holidayBurgundy bg-holidayBurgundy/5' : 'border-gray-200 hover:border-holidayBurgundy'
                          }`}
                      >
                        <img src={p.image} alt={p.product_name} className="w-12 h-12 object-contain flex-shrink-0" />
                        <div className="text-xs line-clamp-2">
                          <div className="font-semibold text-[11px]">{label}</div>
                          <div className="text-gray-600">{p.price.toLocaleString()} 원</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow-product p-4 border border-holidayBurgundy/30 space-y-3">
        <div className="text-2xl font-bold text-black">{priceText}</div>
        <div className="text-sm text-green-700 font-semibold">In stock · Free delivery eligible</div>
        <div className="text-xs text-gray-700">반품/교환 정책은 결제 단계에서 확인할 수 있습니다.</div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => user && addMutation.mutate({ productId: data.product_id, quantity: 1 })}
            className="bg-amazonYellow hover:bg-amazonOrange text-black font-medium px-4 py-2 rounded disabled:opacity-60"
            disabled={!user}
          >
            {user ? t('product.addToCart') : t('product.loginRequired')}
          </button>
          <button className="border border-holidayBurgundy text-white bg-holidayBurgundy px-4 py-2 rounded font-medium hover:bg-amazonOrange hover:text-black transition">
            {t('product.buyNow')}
          </button>
        </div>
        <div className="text-xs text-gray-600">
          Amazon 보안결제, 배송 추적, 간편 환불이 지원됩니다.
        </div>
      </div>
    </div>
  );
}
