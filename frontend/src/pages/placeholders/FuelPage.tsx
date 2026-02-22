import React from 'react';
import { Fuel } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const FuelPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.fuelTitle')} icon={Fuel} parentLabel={t('placeholder.parentEquipment')} parentHref="/fleet" />
);

export default FuelPage;
