import React from 'react';
import { UsersRound } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const CrewPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.crewTitle')} icon={UsersRound} parentLabel={t('placeholder.parentHr')} />
);

export default CrewPage;
