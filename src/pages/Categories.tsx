import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategories } from '../hooks/useCategories';
import { COUNTRY_METADATA, CountryCode } from '../constants/countries';

export default function Categories() {
  const { data, isLoading } = useCategories();
  const { t } = useTranslation();
  const [countryFilter, setCountryFilter] = useState<'all' | CountryCode>('all');

  const filtered = useMemo(() => {
    const list = data?.filter(c => (c.product_count ?? 0) > 0) || [];
    if (countryFilter === 'all') return list;
    return list.filter(c => c.country_id === countryFilter);
  }, [data, countryFilter]);

  const countryOptions = useMemo(() => {
    const codes = new Set<string>();
    data?.forEach(cat => {
      if (cat.country_id) codes.add(cat.country_id);
    });
    return Array.from(codes).filter((code): code is CountryCode => Boolean(COUNTRY_METADATA[code as CountryCode]));
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded shadow-product p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('categoriesPage.title')}</h1>
          <p className="text-sm text-gray-600">{t('categoriesPage.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-700">
          <span className="font-semibold">{t('categoriesPage.filterLabel')}:</span>
          <button
            onClick={() => setCountryFilter('all')}
            className={`px-3 py-1 rounded-full border ${countryFilter === 'all' ? 'bg-holidayBurgundy text-white border-holidayBurgundy' : 'bg-white text-gray-800 border-gray-300'}`}
          >
            {t('categoriesPage.all')}
          </button>
          {countryOptions.map(code => {
            const meta = COUNTRY_METADATA[code];
            return (
              <button
                key={code}
                onClick={() => setCountryFilter(code)}
                className={`px-3 py-1 rounded-full border ${countryFilter === code ? 'bg-holidayBurgundy text-white border-holidayBurgundy' : 'bg-white text-gray-800 border-gray-300'}`}
              >
                {meta ? t(meta.translationKey) : code}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && <div className="text-sm text-gray-600">{t('common.loading')}</div>}

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((c) => (
          <Link
            key={`${c.category_id}-${c.country_id ?? 'all'}`}
            to={`/category/${encodeURIComponent(c.slug || c.category)}`}
            className="bg-white rounded shadow-product p-3 hover:shadow-md transition flex flex-col gap-1"
          >
            <div className="font-semibold">{c.category}</div>
            {c.country_id && (
              <div className="text-xs text-gray-600">
                {t(`stats.market.${c.country_id}` as const, { defaultValue: c.country_id })}
              </div>
            )}
            <div className="text-xs text-gray-600">
              {t('stats.columns.products')}: {(c.product_count ?? 0).toLocaleString()}
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-sm text-gray-700">{t('categoriesPage.empty')}</div>
      )}
    </div>
  );
}
