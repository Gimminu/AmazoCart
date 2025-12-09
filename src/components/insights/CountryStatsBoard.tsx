import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCountryStats } from '../../hooks/useCountryStats';
import { COUNTRY_METADATA, CountryCode } from '../../constants/countries';

export default function CountryStatsBoard() {
  const { data, isLoading } = useCountryStats();
  const { t } = useTranslation();

  const stats = useMemo(() => {
    return (data || []).map((row) => {
      const code = (row.country_id as CountryCode) || 'US';
      const meta = COUNTRY_METADATA[code];
      const currency = meta?.currency || 'USD';
      const locale = meta?.locale || 'en-US';
      const priceFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      });
      const ratingFormatter = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 2
      });

      return {
        code,
        flag: meta?.flag ?? '🌎',
        label: meta ? t(meta.translationKey) : row.country,
        productCount: (row.product_count || 0).toLocaleString(),
        avgPrice: row.avg_price != null ? priceFormatter.format(row.avg_price) : '–',
        avgRating: row.avg_rating != null ? ratingFormatter.format(row.avg_rating) : '–'
      };
    });
  }, [data, t]);

  if (!stats.length && !isLoading) return null;

  return (
    <section className="bg-white rounded shadow-product p-4 border border-gray-100">
      <div className="flex flex-col gap-1 mb-3">
        <h3 className="text-lg font-semibold">{t('stats.title')}</h3>
        <p className="text-sm text-gray-600">{t('stats.subtitle')}</p>
      </div>
      {isLoading && <div className="text-xs text-gray-500 mb-2">{t('common.loading')}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.code || stat.label}
            className="border rounded-lg p-3 flex flex-col gap-1 bg-panelGray/50"
          >
            <div className="flex items-center gap-2 font-semibold text-sm">
              <span>{stat.flag}</span>
              <span>{stat.label}</span>
            </div>
            <div className="text-xs text-gray-600">
              {t('stats.columns.products')}: {stat.productCount}
            </div>
            <div className="text-xs text-gray-600">
              {t('stats.columns.avgPrice')}: {stat.avgPrice}
            </div>
            <div className="text-xs text-gray-600">
              {t('stats.columns.avgRating')}: {stat.avgRating}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
