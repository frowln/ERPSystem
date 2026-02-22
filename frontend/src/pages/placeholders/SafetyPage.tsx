import React from 'react';
import { HardHat } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const SafetyPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.safetyTitle')} icon={HardHat} parentLabel={t('placeholder.parentHr')} />
);

export default SafetyPage;
