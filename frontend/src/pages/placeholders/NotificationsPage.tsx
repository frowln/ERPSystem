import React from 'react';
import { Bell } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const NotificationsPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.notificationsTitle')} icon={Bell} parentLabel={t('placeholder.parentAdmin')} parentHref="/settings" />
);

export default NotificationsPage;
