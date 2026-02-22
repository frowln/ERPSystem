import React from 'react';
import { cn } from '@/lib/cn';

interface PriceIndicatorProps {
  price: number;
  allPrices: number[];
  className?: string;
}

export const PriceIndicator: React.FC<PriceIndicatorProps> = ({
  price,
  allPrices,
  className,
}) => {
  const validPrices = allPrices.filter((p) => p > 0);
  if (validPrices.length < 2 || price <= 0) return null;

  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);

  const isLowest = price === minPrice;
  const isHighest = price === maxPrice;

  if (!isLowest && !isHighest) return null;

  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full flex-shrink-0',
        isLowest ? 'bg-success-500' : 'bg-danger-500',
        className,
      )}
      title={isLowest ? 'Lowest price' : 'Highest price'}
    />
  );
};
