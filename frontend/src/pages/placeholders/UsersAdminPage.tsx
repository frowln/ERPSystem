import React from 'react';
import { UserCog } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const UsersAdminPage: React.FC = () => (
  <PlaceholderPage title="Пользователи" icon={UserCog} parentLabel="Администрирование" parentHref="/settings" />
);

export default UsersAdminPage;
