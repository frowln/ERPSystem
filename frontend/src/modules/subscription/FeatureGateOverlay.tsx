import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface FeatureGateOverlayProps {
  requiredPlan: 'PRO' | 'ENTERPRISE';
  featureName: string;
  className?: string;
}

const PLAN_LABELS: Record<string, string> = {
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

export const FeatureGateOverlay: React.FC<FeatureGateOverlayProps> = ({
  requiredPlan,
  featureName,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-sm p-8 text-center',
        className,
      )}
    >
      <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
        <Lock size={24} className="text-neutral-400 dark:text-neutral-500" />
      </div>

      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        {t('subscription.featureGate.title')}
      </h3>

      <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mb-1">
        {t('subscription.featureGate.description', { feature: featureName })}
      </p>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {t('subscription.featureGate.requiredPlan', { plan: PLAN_LABELS[requiredPlan] ?? requiredPlan })}
      </p>

      <button
        onClick={() => navigate('/pricing')}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium transition-colors"
      >
        <ArrowUpRight size={16} />
        {t('subscription.featureGate.upgrade')}
      </button>
    </div>
  );
};

export default FeatureGateOverlay;
