import React from 'react';
import { MessageCircle } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const MessagingPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.messagingTitle')} icon={MessageCircle} parentLabel={t('placeholder.parentMessaging')} />
);

export default MessagingPage;
