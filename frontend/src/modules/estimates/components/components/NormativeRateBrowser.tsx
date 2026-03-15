import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { estimatesApi, type NormativeRateResult } from '@/api/estimates';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';

interface NormativeRateBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (rate: NormativeRateResult) => void;
}

const sourceFilter: { value: '' | 'GESN' | 'FER' | 'TER'; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'GESN', label: 'ГЭСН' },
  { value: 'FER', label: 'ФЕР' },
  { value: 'TER', label: 'ТЕР' },
];

const sourceBadgeCls: Record<string, string> = {
  GESN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  FER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  TER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const NormativeRateBrowser: React.FC<NormativeRateBrowserProps> = ({ open, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'' | 'GESN' | 'FER' | 'TER'>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['normative-rates', searchTerm, source],
    queryFn: () => estimatesApi.searchNormativeRates(searchTerm, source || undefined),
    enabled: open && searchTerm.length >= 2,
  });

  const handleSearch = () => {
    if (query.trim().length >= 2) setSearchTerm(query.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('estimates.normative.browseRatesTitle')}
      description={t('estimates.normative.browseRatesHint')}
      size="xl"
    >
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder={t('estimates.normative.searchNormative')}
              className="w-full h-9 pl-9 pr-3 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-1">
            {sourceFilter.map((sf) => (
              <button
                key={sf.value}
                onClick={() => setSource(sf.value)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  source === sf.value
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleSearch} disabled={query.trim().length < 2}>
            {t('estimates.normative.searchNormative')}
          </Button>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : rates.length === 0 && searchTerm ? (
          <div className="py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {t('estimates.normative.browseRatesEmpty')}
          </div>
        ) : (
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800">
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 w-24">{t('estimates.normative.colNormCode')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 w-16">{t('estimates.normative.normativeSource')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('estimates.normative.colName')}</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 w-14">{t('estimates.normative.colUnit')}</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 w-24">{t('estimates.normative.colBasePrice2001')}</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 w-20" />
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr
                    key={`${rate.source}-${rate.code}`}
                    className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                    onClick={() => onSelect(rate)}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-primary-600 dark:text-primary-400">{rate.code}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${sourceBadgeCls[rate.source] ?? ''}`}>
                        {rate.source}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100 line-clamp-2">{rate.name}</td>
                    <td className="px-3 py-2 text-center text-neutral-500 dark:text-neutral-400">{rate.unit}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{formatMoney(rate.basePrice2001)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onSelect(rate); }}
                      >
                        {t('estimates.normative.browseRatesSelect')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NormativeRateBrowser;
