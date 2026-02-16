import React from 'react';
import { ListTodo } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const TaskListPage: React.FC = () => (
  <PlaceholderPage title="Задачи (список)" icon={ListTodo} parentLabel="Проекты" parentHref="/projects" />
);

export default TaskListPage;
