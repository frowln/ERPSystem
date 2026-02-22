import React from 'react';
import { BarChart3 } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const AnalyticsDashboardPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.analyticsTitle')} icon={BarChart3} parentLabel={t('placeholder.parentAnalytics')} />
);

export default AnalyticsDashboardPage;
