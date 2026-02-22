import React from 'react';
import { GanttChart } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const GanttPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.ganttTitle')} icon={GanttChart} parentLabel={t('placeholder.parentProjects')} parentHref="/projects" />
);

export default GanttPage;
