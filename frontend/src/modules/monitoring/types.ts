export type EventLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface SystemEvent {
  id: string;
  timestamp: string;
  service: string;
  level: EventLevel;
  message: string;
  details?: string;
  createdAt: string;
}

export interface HealthCheck {
  id: string;
  service: string;
  status: HealthStatus;
  responseTime: number;
  uptime: string;
  lastCheck: string;
}

export interface SystemMetrics {
  uptime: string;
  avgResponseTime: number;
  activeUsers: number;
  errorsPerHour: number;
  warningsPerHour: number;
}

export interface ServiceStatus {
  id: string;
  name: string;
  status: HealthStatus;
  responseTime: number;
  uptime: string;
  lastCheck: string;
  version?: string;
  instanceCount?: number;
}

export interface MonitoringDashboard {
  metrics: SystemMetrics;
  healthChecks: HealthCheck[];
  recentEvents: SystemEvent[];
}

export interface AlertRule {
  id: string;
  name: string;
  service: string;
  condition: string;
  threshold: number;
  isEnabled: boolean;
  notifyChannels: string[];
  createdAt: string;
  updatedAt: string;
}
