import React from 'react';
import { CalendarDays } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const CalendarPage: React.FC = () => (
  <PlaceholderPage title="Календарь" icon={CalendarDays} parentLabel="Проекты" parentHref="/projects" />
);

export default CalendarPage;
