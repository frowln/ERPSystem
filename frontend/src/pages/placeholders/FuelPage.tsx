import React from 'react';
import { Fuel } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const FuelPage: React.FC = () => (
  <PlaceholderPage title="Учёт топлива" icon={Fuel} parentLabel="Техника" parentHref="/fleet" />
);

export default FuelPage;
