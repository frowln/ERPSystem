import React from 'react';
import { Plug } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const IntegrationsPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.integrationsTitle')} icon={Plug} parentLabel={t('placeholder.parentAdmin')} parentHref="/settings" />
);

export default IntegrationsPage;
