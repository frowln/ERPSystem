import React from 'react';
import { CalendarDays } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const CalendarPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.calendarTitle')} icon={CalendarDays} parentLabel={t('placeholder.parentProjects')} parentHref="/projects" />
);

export default CalendarPage;
