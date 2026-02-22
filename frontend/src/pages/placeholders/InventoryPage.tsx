import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const InventoryPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.inventoryTitle')} icon={ClipboardCheck} parentLabel={t('placeholder.parentWarehouse')} />
);

export default InventoryPage;
