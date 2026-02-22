import React from 'react';
import { FileBarChart } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const ReportsPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.reportsTitle')} icon={FileBarChart} parentLabel={t('placeholder.parentAnalytics')} />
);

export default ReportsPage;
