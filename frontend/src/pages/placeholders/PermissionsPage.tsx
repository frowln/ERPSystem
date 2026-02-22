import React from 'react';
import { Shield } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const PermissionsPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.permissionsTitle')} icon={Shield} parentLabel={t('placeholder.parentAdmin')} parentHref="/settings" />
);

export default PermissionsPage;
