import React from 'react';
import { MessageCircle } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const MessagingPage: React.FC = () => (
  <PlaceholderPage title="Мессенджер" icon={MessageCircle} parentLabel="Общение" />
);

export default MessagingPage;
