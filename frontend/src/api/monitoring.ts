import { apiClient } from './client';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  uptimeFormatted: string;
  lastChecked: string;
  version: string;
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  errorCount: number;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARNING' | 'CRITICAL';
  message: string;
  service: string;
  stackTrace?: string;
  count: number;
}

export interface PerformanceMetric {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  requestsPerSecond: number;
  averageResponseTime: number;
}

export interface MonitoringDashboardData {
  systemHealth: SystemHealth;
  services: ServiceStatus[];
  recentErrors: ErrorLogEntry[];
  performanceMetrics: PerformanceMetric[];
}

export interface MonitoringFilters {
  dateFrom?: string;
  dateTo?: string;
  service?: string;
  level?: string;
}

// Backend endpoints:
//   GET /api/health                → HealthResponse { status, version, timestamp, details }
//   GET /api/health/status         → { status, version, timestamp, uptime, services[] }
//   GET /api/admin/health/status   → List<HealthCheckResponse> (admin-only)

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export const monitoringApi = {
  // Combines /api/health and /api/health/status into MonitoringDashboardData
  getDashboardData: async (): Promise<MonitoringDashboardData> => {
    try {
      const [healthResp, statusResp] = await Promise.allSettled([
        apiClient.get('/health'),
        apiClient.get('/health/status'),
      ]);

      const healthData = healthResp.status === 'fulfilled' ? healthResp.value.data : null;
      const statusData = statusResp.status === 'fulfilled' ? statusResp.value.data : null;

      // Parse uptime
      const uptimeSec = Number(statusData?.uptime ?? healthData?.details?.uptime ?? 0);

      // Map backend status strings to our enum
      const backendStatus = (statusData?.status ?? healthData?.status ?? 'UP').toUpperCase();
      const healthStatus: SystemHealth['status'] =
        backendStatus === 'UP' || backendStatus === 'OPERATIONAL' ? 'healthy'
        : backendStatus === 'DEGRADED' ? 'degraded'
        : 'down';

      const systemHealth: SystemHealth = {
        status: healthStatus,
        uptime: uptimeSec,
        uptimeFormatted: formatUptime(uptimeSec),
        lastChecked: statusData?.timestamp ?? healthData?.timestamp ?? new Date().toISOString(),
        version: statusData?.version ?? healthData?.version ?? '1.0.0',
      };

      // Parse services from /api/health/status response
      const services: ServiceStatus[] = [];
      if (statusData?.services && Array.isArray(statusData.services)) {
        for (const svc of statusData.services) {
          const svcStatus = String(svc.status ?? 'operational').toLowerCase();
          services.push({
            name: svc.name ?? 'unknown',
            status: svcStatus === 'operational' || svcStatus === 'up' ? 'up'
              : svcStatus === 'degraded' ? 'degraded'
              : 'down',
            responseTime: svc.latencyMs ?? 0,
            lastCheck: statusData.timestamp ?? new Date().toISOString(),
            errorCount: 0,
          });
        }
      }

      return {
        systemHealth,
        services,
        recentErrors: [],
        performanceMetrics: [],
      };
    } catch {
      return {
        systemHealth: {
          status: 'down',
          uptime: 0,
          uptimeFormatted: '0m',
          lastChecked: new Date().toISOString(),
          version: 'unknown',
        },
        services: [],
        recentErrors: [],
        performanceMetrics: [],
      };
    }
  },

  // Backend: GET /api/health
  getSystemHealth: async (): Promise<SystemHealth> => {
    try {
      const response = await apiClient.get('/health');
      const d = response.data;
      const uptimeSec = Number(d?.details?.uptime ?? 0);
      const status = String(d?.status ?? 'UP').toUpperCase();
      return {
        status: status === 'UP' ? 'healthy' : status === 'DEGRADED' ? 'degraded' : 'down',
        uptime: uptimeSec,
        uptimeFormatted: formatUptime(uptimeSec),
        lastChecked: d?.timestamp ?? new Date().toISOString(),
        version: d?.version ?? '1.0.0',
      };
    } catch {
      return { status: 'down', uptime: 0, uptimeFormatted: '0m', lastChecked: new Date().toISOString(), version: 'unknown' };
    }
  },

  // Backend: GET /api/health/status → services array
  getServices: async (): Promise<ServiceStatus[]> => {
    try {
      const response = await apiClient.get('/health/status');
      const d = response.data;
      if (!d?.services || !Array.isArray(d.services)) return [];
      return d.services.map((svc: { name?: string; status?: string; latencyMs?: number }) => {
        const s = String(svc.status ?? 'operational').toLowerCase();
        return {
          name: svc.name ?? 'unknown',
          status: s === 'operational' || s === 'up' ? 'up' as const
            : s === 'degraded' ? 'degraded' as const
            : 'down' as const,
          responseTime: svc.latencyMs ?? 0,
          lastCheck: d.timestamp ?? new Date().toISOString(),
          errorCount: 0,
        };
      });
    } catch {
      return [];
    }
  },

  // Backend: GET /api/admin/events/recent-errors → List<SystemEventResponse>
  getErrorLogs: async (_params?: MonitoringFilters): Promise<ErrorLogEntry[]> => {
    try {
      const response = await apiClient.get('/admin/events/recent-errors', { _silentErrors: true } as any);
      const data = response.data;
      const items = Array.isArray(data) ? data : (data?.content ?? []);
      return items.map((e: any) => ({
        id: e.id ?? '',
        timestamp: e.occurredAt ?? e.createdAt ?? '',
        level: (e.severity ?? e.severityDisplayName ?? 'ERROR').toUpperCase() as ErrorLogEntry['level'],
        message: e.message ?? '',
        service: e.source ?? '',
        stackTrace: typeof e.details === 'object' ? JSON.stringify(e.details) : e.details,
        count: 1,
      }));
    } catch {
      return [];
    }
  },

  // Backend: GET /api/admin/metrics/dashboard
  getPerformanceMetrics: async (_params?: MonitoringFilters): Promise<PerformanceMetric[]> => {
    try {
      const response = await apiClient.get('/admin/metrics/dashboard', { _silentErrors: true } as any);
      const data = response.data;
      if (!data) return [];
      // Dashboard returns aggregated metrics; wrap as single point
      return [{
        timestamp: new Date().toISOString(),
        cpuUsage: data.cpuUsage ?? 0,
        memoryUsage: data.memoryUsage ?? 0,
        diskUsage: data.diskUsage ?? 0,
        requestsPerSecond: data.requestsPerSecond ?? 0,
        averageResponseTime: data.averageResponseTime ?? 0,
      }];
    } catch {
      return [];
    }
  },

  // No dedicated backend endpoint — log acknowledgement via system event
  acknowledgeError: async (errorId: string): Promise<void> => {
    await apiClient.post('/admin/events', {
      eventType: 'WARNING',
      severity: 'INFO',
      message: `Error ${errorId} acknowledged by admin`,
      source: 'monitoring-ui',
    });
  },
};
