type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDev = import.meta.env.DEV;
const MIN_LEVEL: LogLevel = isDev ? 'debug' : 'info';

function getUserId(): string | undefined {
  try {
    const raw = localStorage.getItem('privod-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.user?.id;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[MIN_LEVEL]) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
  };

  const userId = getUserId();
  if (userId) entry.userId = userId;

  if (isDev) {
    const colors: Record<LogLevel, string> = {
      debug: 'color: #9ca3af',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
    };
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(
      `%c[${level.toUpperCase()}]%c ${message}`,
      colors[level] + '; font-weight: bold',
      'color: inherit',
      context ?? '',
    );
  } else {
    // Production: structured JSON for log aggregation
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(JSON.stringify(entry));
  }
}

export const log = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
};
