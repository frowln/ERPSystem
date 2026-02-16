import React from 'react';
import { Shield } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const PermissionsPage: React.FC = () => (
  <PlaceholderPage title="Права доступа" icon={Shield} parentLabel="Администрирование" parentHref="/settings" />
);

export default PermissionsPage;
