import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Package,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Clock,
  MapPin,
  Ruler,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { warehouseApi } from '@/api/warehouse';
import { t } from '@/i18n';
import { formatNumber, formatTime } from '@/lib/format';

interface ScannedMaterial {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  totalStock: number;
  location: string;
}

interface RecentScan {
  id: string;
  barcode: string;
  materialName: string;
  timestamp: Date;
  success: boolean;
}

const BarcodeScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [material, setMaterial] = useState<ScannedMaterial | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  const lookupBarcode = useCallback(
    async (code: string) => {
      setScanLoading(true);
      try {
        const mat = await warehouseApi.lookupMaterialByBarcode(code);
        const detail = await warehouseApi.getMaterial(mat.id).catch(() => null);
        const stockData = await warehouseApi.getMaterialStock(mat.id).catch(() => []);
        const topLocation = stockData.length > 0 ? stockData[0].locationName : '-';
        const totalQty = stockData.reduce((sum, s) => sum + s.available, 0);

        const scannedMat: ScannedMaterial = {
          id: mat.id,
          name: mat.name,
          sku: (mat as unknown as Record<string, unknown>).code as string ?? detail?.sku ?? '',
          category: detail?.category ?? (mat as unknown as Record<string, unknown>).category as string ?? '',
          unit: (mat as unknown as Record<string, unknown>).unitOfMeasure as string ?? detail?.unit ?? '',
          totalStock: totalQty || detail?.totalStock || 0,
          location: topLocation,
        };
        setMaterial(scannedMat);
        setRecentScans((prev) => [
          {
            id: crypto.randomUUID(),
            barcode: code,
            materialName: mat.name,
            timestamp: new Date(),
            success: true,
          },
          ...prev.slice(0, 19),
        ]);
        toast.success(t('warehouse.scanner.found', { name: mat.name }));
      } catch {
        setMaterial(null);
        setRecentScans((prev) => [
          {
            id: crypto.randomUUID(),
            barcode: code,
            materialName: t('warehouse.scanner.unknownMaterial'),
            timestamp: new Date(),
            success: false,
          },
          ...prev.slice(0, 19),
        ]);
        toast.error(t('warehouse.scanner.notFound', { code }));
      } finally {
        setScanLoading(false);
      }
    },
    [],
  );

  const handleCameraScan = useCallback(
    (code: string) => {
      setShowScanner(false);
      lookupBarcode(code);
    },
    [lookupBarcode],
  );

  function handleManualLookup() {
    const code = manualBarcode.trim();
    if (!code) return;
    lookupBarcode(code);
    setManualBarcode('');
  }

  function handleManualKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualLookup();
    }
  }

  function quickAction(action: 'receipt' | 'issue' | 'transfer') {
    if (!material) return;
    if (action === 'receipt') {
      navigate(`/warehouse/movements/new?type=RECEIPT&materialId=${material.id}`);
    } else if (action === 'issue') {
      navigate(`/warehouse/movements/new?type=ISSUE&materialId=${material.id}`);
    } else {
      navigate(`/warehouse/inter-project-transfers?materialId=${material.id}`);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.scanner.title')}
        subtitle={t('warehouse.scanner.subtitle')}
        backTo="/warehouse/materials"
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.scanner.breadcrumb') },
        ]}
      />

      <div className="max-w-2xl space-y-6">
        {/* Camera scan button */}
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          disabled={scanLoading}
          className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <div className="text-base font-semibold text-blue-700 dark:text-blue-300">
              {t('warehouse.scanner.openCamera')}
            </div>
            <div className="text-sm text-blue-600/70 dark:text-blue-400/70">
              {t('warehouse.scanner.cameraHint')}
            </div>
          </div>
        </button>

        {/* Manual input */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
          <span className="text-xs text-neutral-400 uppercase">{t('warehouse.scanner.orManual')}</span>
          <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
        </div>

        <div className="flex gap-3">
          <FormField label={t('warehouse.scanner.manualLabel')} className="flex-1">
            <Input
              placeholder={t('warehouse.scanner.manualPlaceholder')}
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={handleManualKeyDown}
            />
          </FormField>
          <div className="pt-6">
            <Button
              onClick={handleManualLookup}
              disabled={!manualBarcode.trim() || scanLoading}
              loading={scanLoading}
              iconLeft={<Search size={16} />}
            >
              {t('warehouse.scanner.lookupBtn')}
            </Button>
          </div>
        </div>

        {/* Material card */}
        {material && (
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {material.name}
                  </h3>
                  {material.sku && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {material.sku}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-neutral-100 dark:divide-neutral-800">
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="text-xs">{t('warehouse.scanner.cardStock')}</span>
                </div>
                <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {formatNumber(material.totalStock)}
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs">{t('warehouse.scanner.cardLocation')}</span>
                </div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {material.location}
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="text-xs">{t('warehouse.scanner.cardUnit')}</span>
                </div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {material.unit}
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                  <Package className="w-3.5 h-3.5" />
                  <span className="text-xs">{t('warehouse.scanner.cardCategory')}</span>
                </div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {material.category || '-'}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 font-medium uppercase tracking-wide">
                {t('warehouse.scanner.quickActions')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => quickAction('receipt')}
                  iconLeft={<ArrowDownToLine size={14} />}
                >
                  {t('warehouse.scanner.actionReceipt')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => quickAction('issue')}
                  iconLeft={<ArrowUpFromLine size={14} />}
                >
                  {t('warehouse.scanner.actionIssue')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => quickAction('transfer')}
                  iconLeft={<ArrowLeftRight size={14} />}
                >
                  {t('warehouse.scanner.actionTransfer')}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Recent scans */}
        {recentScans.length > 0 && (
          <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('warehouse.scanner.recentTitle')}
              </h3>
              <span className="text-xs text-neutral-400 ml-auto">
                {recentScans.length}
              </span>
            </div>
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-64 overflow-y-auto">
              {recentScans.map((scan) => (
                <li
                  key={scan.id}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (scan.success) lookupBarcode(scan.barcode);
                  }}
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      scan.success ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {scan.materialName}
                    </div>
                    <div className="text-xs text-neutral-400 font-mono truncate">
                      {scan.barcode}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400 tabular-nums shrink-0">
                    {formatTime(scan.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleCameraScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default BarcodeScannerPage;
