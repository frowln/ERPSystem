import React from 'react';
import { GanttChart } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const GanttPage: React.FC = () => (
  <PlaceholderPage title="Диаграмма Ганта" icon={GanttChart} parentLabel="Проекты" parentHref="/projects" />
);

export default GanttPage;
