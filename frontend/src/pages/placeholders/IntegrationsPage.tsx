import React from 'react';
import { Plug } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const IntegrationsPage: React.FC = () => (
  <PlaceholderPage title="Интеграции" icon={Plug} parentLabel="Администрирование" parentHref="/settings" />
);

export default IntegrationsPage;
