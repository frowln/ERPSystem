import React from 'react';
import { Star } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const FavoritesPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.favoritesTitle')} icon={Star} parentLabel={t('placeholder.parentMessaging')} parentHref="/messaging" />
);

export default FavoritesPage;
