import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-primary-600">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{t('notFound.title')}</h1>
        <p className="mt-3 text-sm text-neutral-500">
          {t('notFound.description')}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/')}>
            {t('notFound.goHome')}
          </Button>
          <Button onClick={() => navigate('/search')}>
            {t('notFound.openSearch')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
