export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR' | 'MAINTENANCE';
export type SensorType = 'TEMPERATURE' | 'HUMIDITY' | 'VIBRATION' | 'PRESSURE' | 'GPS' | 'DUST' | 'NOISE' | 'STRUCTURAL';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface IoTDevice {
  id: string;
  code: string;
  name: string;
  sensorType: SensorType;
  status: DeviceStatus;
  projectId?: string;
  projectName?: string;
  location: string;
  lastReadingValue?: number;
  lastReadingUnit?: string;
  lastReadingAt?: string;
  batteryLevel?: number;
  firmwareVersion?: string;
  installedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  deviceName?: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  timestamp: string;
  isAnomaly: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  deviceId?: string;
  sensorType: SensorType;
  condition: 'above' | 'below' | 'equals' | 'out_of_range';
  thresholdMin?: number;
  thresholdMax?: number;
  severity: AlertSeverity;
  isActive: boolean;
  notifyEmails: string[];
  createdAt: string;
}

export interface IoTAlert {
  id: string;
  ruleId: string;
  ruleName?: string;
  deviceId: string;
  deviceName: string;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  acknowledgedById?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  triggeredAt: string;
}
