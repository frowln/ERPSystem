import toast from 'react-hot-toast';

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
export const DEMO_MODE_BLOCKED_ERROR_CODE = 'ERR_DEMO_MODE_WRITE_BLOCKED';

export const getDemoModeBlockedMessage = (action = 'Изменение данных'): string =>
  `${action} недоступно в режиме DEMO DATA`;

export const notifyDemoModeBlockedAction = (action?: string): void => {
  if (typeof window === 'undefined') return;
  toast.error(getDemoModeBlockedMessage(action));
};

export const guardDemoModeAction = (action?: string): boolean => {
  if (!isDemoMode) return false;
  notifyDemoModeBlockedAction(action);
  return true;
};
