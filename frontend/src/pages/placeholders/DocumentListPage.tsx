import React from 'react';
import { FileText } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const DocumentListPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.documentsTitle')} icon={FileText} parentLabel={t('placeholder.parentProjects')} parentHref="/projects" />
);

export default DocumentListPage;
