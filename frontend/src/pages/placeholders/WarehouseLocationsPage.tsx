import React from 'react';
import { Warehouse } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const WarehouseLocationsPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.warehouseLocationsTitle')} icon={Warehouse} parentLabel={t('placeholder.parentWarehouse')} />
);

export default WarehouseLocationsPage;
