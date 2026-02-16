import React from 'react';
import { Wrench } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const MaintenancePage: React.FC = () => (
  <PlaceholderPage title="Обслуживание техники" icon={Wrench} parentLabel="Техника" parentHref="/fleet" />
);

export default MaintenancePage;
