import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types/Product';
import { useTranslation } from 'react-i18next';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface Props {
  product: Product;
  variantImages?: string[];
  variantCount?: number;
  variantProducts?: Product[];
}

function Rating({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className="flex items-center gap-1 text-xs">
      <div className="flex">
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} className={i + 1 <= rounded ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
      <span className="text-gray-600">{rounded}</span>
    </div>
  );
}

export default function ProductCard({ product, variantImages, variantCount, variantProducts }: Props) {
  const [activeImage, setActiveImage] = useState(product.image);
  const rating = product.avg_rating ?? 0;
  const reviewCount = product.review_count ?? 0;
  const placeholder = 'https://via.placeholder.com/400x400?text=Product';
  const fallbackThumbs = Array.from(
    new Set([product.image, ...(variantImages || [])].filter(Boolean))
  );
  const variantLinks = variantProducts
    ? Array.from(new Map(variantProducts.map((v) => [v.product_id, v])).values())
    : [];
  const imgSrc = activeImage || product.image || placeholder;
  const { t } = useTranslation();
  const { format } = useCurrencyFormatter();
  const variantState = variantLinks.length ? { variantGroup: variantLinks } : undefined;

  return (
    <div className="bg-white p-3 rounded shadow-product hover:shadow-md transition flex flex-col">
      <div className="relative mb-2">
        {variantCount && variantCount > 1 && (
          <div className="absolute right-1 top-1 text-[11px] px-2 py-1 rounded-full bg-holidayBurgundy/90 text-white font-semibold shadow-sm">
            {variantCount} options
          </div>
        )}
        <Link to={`/product/${product.product_id}`} state={variantState} className="block">
          <img
            src={imgSrc}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = placeholder;
            }}
            alt={product.product_name}
            className="w-full h-48 object-contain mx-auto"
          />
        </Link>
        {variantLinks.length > 1 ? (
          <div className="absolute left-1 bottom-1 flex gap-1 bg-white/85 backdrop-blur px-1 py-1 rounded">
            {variantLinks.slice(0, 4).map((variant) => {
              const isActive = variant.product_id === product.product_id;
              return (
                <Link
                  key={variant.product_id}
                  to={`/product/${variant.product_id}`}
                  state={variantState}
                  onMouseEnter={() => variant.image && setActiveImage(variant.image)}
                  className={`h-9 w-9 border rounded overflow-hidden ${
                    isActive ? 'border-holidayBurgundy' : 'border-gray-200 hover:border-holidayBurgundy'
                  }`}
                  title={variant.product_name}
                >
                  <img
                    src={variant.image || placeholder}
                    alt={variant.product_name}
                    className="h-full w-full object-contain bg-white"
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          fallbackThumbs.length > 1 && (
            <div className="absolute left-1 bottom-1 flex gap-1 bg-white/85 backdrop-blur px-1 py-1 rounded">
              {fallbackThumbs.slice(0, 4).map((src) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(src!)}
                  className={`h-8 w-8 border rounded ${
                    activeImage === src ? 'border-holidayBurgundy' : 'border-gray-200'
                  }`}
                  aria-label="variant thumbnail"
                >
                  <img src={src!} alt="thumb" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )
        )}
      </div>
      <h3
        className="text-sm font-medium mb-1 overflow-hidden text-ellipsis"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        title={product.product_name}
      >
        {product.product_name}
      </h3>
      <div
        className="text-xs text-gray-500 mb-2 truncate"
        title={product.category_name || product.category || '카테고리 미정'}
      >
        {product.category_name || product.category || '카테고리 미정'}
      </div>
      <div className="font-semibold mb-1 text-black">{format(product.price)}</div>
      <div className="flex items-center justify-between text-xs text-amazonBlue">
        <Rating value={rating} />
        <span>리뷰 {reviewCount}</span>
      </div>
      <Link
        to={`/product/${product.product_id}`}
        state={variantState}
        className="mt-3 bg-holidayBurgundy text-white text-center py-1 rounded text-sm font-medium hover:bg-amazonOrange"
      >
        {t('product.view')}
      </Link>
    </div>
  );
}
