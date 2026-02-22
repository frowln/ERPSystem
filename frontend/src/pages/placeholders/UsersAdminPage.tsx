import React from 'react';
import { UserCog } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const UsersAdminPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.usersTitle')} icon={UserCog} parentLabel={t('placeholder.parentAdmin')} parentHref="/settings" />
);

export default UsersAdminPage;
