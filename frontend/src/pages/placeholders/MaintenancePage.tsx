import React from 'react';
import { Wrench } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const MaintenancePage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.maintenanceTitle')} icon={Wrench} parentLabel={t('placeholder.parentFleet')} parentHref="/fleet" />
);

export default MaintenancePage;
