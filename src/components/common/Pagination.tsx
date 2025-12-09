import { useTranslation } from 'react-i18next';

interface Props {
  page: number;
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  label?: string;
}

export default function Pagination({ page, onPrev, onNext, disablePrev, disableNext, label }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      {label && <div className="text-xs text-gray-500">{label}</div>}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={disablePrev}
          className="px-3 py-1.5 rounded-full border bg-white hover:bg-panelGray disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          ← {t('pagination.prev')}
        </button>
        <span className="text-sm font-semibold text-gray-800 px-3 py-1.5 rounded-full bg-panelGray/60 border border-gray-200">
          {t('pagination.page', { page })}
        </span>
        <button
          onClick={onNext}
          disabled={disableNext}
          className="px-3 py-1.5 rounded-full border bg-white hover:bg-panelGray disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {t('pagination.next')} →
        </button>
      </div>
    </div>
  );
}
