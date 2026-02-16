import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const InventoryPage: React.FC = () => (
  <PlaceholderPage title="Инвентаризация" icon={ClipboardCheck} parentLabel="Склад" />
);

export default InventoryPage;
