import {
  Rocket, Wallet, Users, HardHat, Warehouse, ShieldCheck,
  AlertTriangle, Target, FileText, Plug, Settings, GitBranch,
  Calculator,
} from 'lucide-react';

export interface KbCategory {
  id: string;
  icon: typeof Rocket;
  color: string;
  bgColor: string;
  darkBgColor: string;
}

export const KB_CATEGORIES: KbCategory[] = [
  { id: 'getting-started', icon: Rocket,        color: 'text-emerald-600', bgColor: 'bg-emerald-50',  darkBgColor: 'dark:bg-emerald-900/20' },
  { id: 'finance',         icon: Wallet,         color: 'text-violet-600',  bgColor: 'bg-violet-50',   darkBgColor: 'dark:bg-violet-900/20' },
  { id: 'estimates',       icon: Calculator,     color: 'text-indigo-600',  bgColor: 'bg-indigo-50',   darkBgColor: 'dark:bg-indigo-900/20' },
  { id: 'hr',              icon: Users,           color: 'text-blue-600',    bgColor: 'bg-blue-50',     darkBgColor: 'dark:bg-blue-900/20' },
  { id: 'construction',    icon: HardHat,         color: 'text-amber-600',   bgColor: 'bg-amber-50',    darkBgColor: 'dark:bg-amber-900/20' },
  { id: 'warehouse',       icon: Warehouse,       color: 'text-orange-600',  bgColor: 'bg-orange-50',   darkBgColor: 'dark:bg-orange-900/20' },
  { id: 'quality',         icon: ShieldCheck,     color: 'text-green-600',   bgColor: 'bg-green-50',    darkBgColor: 'dark:bg-green-900/20' },
  { id: 'safety',          icon: AlertTriangle,   color: 'text-red-600',     bgColor: 'bg-red-50',      darkBgColor: 'dark:bg-red-900/20' },
  { id: 'crm',             icon: Target,          color: 'text-pink-600',    bgColor: 'bg-pink-50',     darkBgColor: 'dark:bg-pink-900/20' },
  { id: 'documents',       icon: FileText,        color: 'text-sky-600',     bgColor: 'bg-sky-50',      darkBgColor: 'dark:bg-sky-900/20' },
  { id: 'integrations',    icon: Plug,            color: 'text-cyan-600',    bgColor: 'bg-cyan-50',     darkBgColor: 'dark:bg-cyan-900/20' },
  { id: 'settings',        icon: Settings,        color: 'text-neutral-600', bgColor: 'bg-neutral-50',  darkBgColor: 'dark:bg-neutral-800/50' },
  { id: 'analytics',       icon: GitBranch,       color: 'text-purple-600',  bgColor: 'bg-purple-50',   darkBgColor: 'dark:bg-purple-900/20' },
  { id: 'workflows',       icon: GitBranch,       color: 'text-teal-600',    bgColor: 'bg-teal-50',     darkBgColor: 'dark:bg-teal-900/20' },
];

export const KB_CATEGORY_MAP = Object.fromEntries(KB_CATEGORIES.map(c => [c.id, c]));
