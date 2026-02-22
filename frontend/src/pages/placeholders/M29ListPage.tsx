import React from 'react';
import { Package } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const M29ListPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.m29Title')} icon={Package} parentLabel={t('placeholder.parentConstruction')} />
);

export default M29ListPage;
