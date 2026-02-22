import React from 'react';
import { ShieldCheck } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const QualityListPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.qualityTitle')} icon={ShieldCheck} parentLabel={t('placeholder.parentConstruction')} />
);

export default QualityListPage;
