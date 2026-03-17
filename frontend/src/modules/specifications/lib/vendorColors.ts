/**
 * 10-color palette for vendor columns in the supplier comparison matrix.
 * Works in both light and dark mode.
 */

export interface VendorColor {
  lightBg: string;
  darkBg: string;
  dot: string;
  border: string;
  headerText: string;
}

const VENDOR_COLORS: VendorColor[] = [
  { lightBg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/20', dot: 'bg-blue-500', border: 'border-blue-500', headerText: 'text-blue-700 dark:text-blue-300' },
  { lightBg: 'bg-teal-50', darkBg: 'dark:bg-teal-900/20', dot: 'bg-teal-500', border: 'border-teal-500', headerText: 'text-teal-700 dark:text-teal-300' },
  { lightBg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/20', dot: 'bg-amber-500', border: 'border-amber-500', headerText: 'text-amber-700 dark:text-amber-300' },
  { lightBg: 'bg-rose-50', darkBg: 'dark:bg-rose-900/20', dot: 'bg-rose-500', border: 'border-rose-500', headerText: 'text-rose-700 dark:text-rose-300' },
  { lightBg: 'bg-violet-50', darkBg: 'dark:bg-violet-900/20', dot: 'bg-violet-500', border: 'border-violet-500', headerText: 'text-violet-700 dark:text-violet-300' },
  { lightBg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20', dot: 'bg-emerald-500', border: 'border-emerald-500', headerText: 'text-emerald-700 dark:text-emerald-300' },
  { lightBg: 'bg-orange-50', darkBg: 'dark:bg-orange-900/20', dot: 'bg-orange-500', border: 'border-orange-500', headerText: 'text-orange-700 dark:text-orange-300' },
  { lightBg: 'bg-cyan-50', darkBg: 'dark:bg-cyan-900/20', dot: 'bg-cyan-500', border: 'border-cyan-500', headerText: 'text-cyan-700 dark:text-cyan-300' },
  { lightBg: 'bg-fuchsia-50', darkBg: 'dark:bg-fuchsia-900/20', dot: 'bg-fuchsia-500', border: 'border-fuchsia-500', headerText: 'text-fuchsia-700 dark:text-fuchsia-300' },
  { lightBg: 'bg-lime-50', darkBg: 'dark:bg-lime-900/20', dot: 'bg-lime-500', border: 'border-lime-500', headerText: 'text-lime-700 dark:text-lime-300' },
];

export function getVendorColor(index: number): VendorColor {
  return VENDOR_COLORS[index % VENDOR_COLORS.length];
}

export { VENDOR_COLORS };
