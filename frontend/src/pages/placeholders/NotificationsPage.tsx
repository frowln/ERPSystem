import React from 'react';
import { Bell } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const NotificationsPage: React.FC = () => (
  <PlaceholderPage title="Уведомления" icon={Bell} parentLabel="Администрирование" parentHref="/settings" />
);

export default NotificationsPage;
