import React from 'react';
import { Star } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const FavoritesPage: React.FC = () => (
  <PlaceholderPage title="Избранное" icon={Star} parentLabel="Общение" parentHref="/messaging" />
);

export default FavoritesPage;
