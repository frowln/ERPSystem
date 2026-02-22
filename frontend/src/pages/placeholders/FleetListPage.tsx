import React from 'react';
import { Truck } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const FleetListPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.fleetTitle')} icon={Truck} parentLabel={t('placeholder.parentEquipment')} />
);

export default FleetListPage;
