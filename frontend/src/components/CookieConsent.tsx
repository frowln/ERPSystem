import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/i18n';

const COOKIE_CONSENT_KEY = 'privod-cookie-consent';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
    try {
      import('@/api/client').then(({ apiClient }) => {
        apiClient.post('/api/consent', { consentType: 'COOKIES' }).catch(() => {});
      });
    } catch (e) { /* non-critical, user may not be logged in */ }
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 shadow-lg px-4 py-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-300 flex-1">
          {t('cookie.message')}{' '}
          <Link to="/privacy" className="text-primary-600 hover:underline">
            {t('cookie.learnMore')}
          </Link>
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 px-4 py-2 transition-colors"
          >
            {t('cookie.decline')}
          </button>
          <button
            onClick={accept}
            className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-5 py-2 rounded-lg transition-colors"
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
