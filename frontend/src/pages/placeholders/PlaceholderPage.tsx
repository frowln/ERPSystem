import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Info } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';

interface PlaceholderPageProps {
  title: string;
  icon: React.ElementType;
  parentLabel?: string;
  parentHref?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  icon: Icon,
  parentLabel,
  parentHref,
}) => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-400 mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 hover:text-neutral-600 transition-colors"
        >
          <Home size={14} />
          <span>{t('placeholder.home')}</span>
        </button>
        {parentLabel && (
          <>
            <span>/</span>
            {parentHref ? (
              <button
                onClick={() => navigate(parentHref)}
                className="hover:text-neutral-600 transition-colors"
              >
                {parentLabel}
              </button>
            ) : (
              <span>{parentLabel}</span>
            )}
          </>
        )}
        <span>/</span>
        <span className="text-neutral-600">{title}</span>
      </nav>

      {/* Content */}
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mb-6">
          <Icon size={36} className="text-primary-500" />
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{title}</h1>
        <div className="flex items-center gap-2 text-neutral-500 mb-8">
          <Info size={18} />
          <p className="text-base">{t('placeholder.unavailable')}</p>
        </div>
        <p className="text-sm text-neutral-400 max-w-md mb-8">
          {t('placeholder.description')}
        </p>
        <Button variant="secondary" onClick={() => navigate('/')}>
          {t('placeholder.backToHome')}
        </Button>
      </div>
    </div>
  );
};

export default PlaceholderPage;
