import React from 'react';
import { BookOpen } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const DailyLogPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.dailyLogTitle')} icon={BookOpen} parentLabel={t('placeholder.parentConstruction')} />
);

export default DailyLogPage;
