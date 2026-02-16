import React from 'react';
import { FileText } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const DocumentListPage: React.FC = () => (
  <PlaceholderPage title="Документы" icon={FileText} parentLabel="Проекты" parentHref="/projects" />
);

export default DocumentListPage;
