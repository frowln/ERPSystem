package com.privod.platform.modules.iot.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.iot.domain.AlertSeverity;
import com.privod.platform.modules.iot.domain.AlertStatus;
import com.privod.platform.modules.iot.domain.AlertType;
import com.privod.platform.modules.iot.domain.DeviceStatus;
import com.privod.platform.modules.iot.domain.IoTAlert;
import com.privod.platform.modules.iot.domain.IoTAlertRule;
import com.privod.platform.modules.iot.domain.IoTDevice;
import com.privod.platform.modules.iot.domain.IoTSensorData;
import com.privod.platform.modules.iot.repository.IoTAlertRepository;
import com.privod.platform.modules.iot.repository.IoTAlertRuleRepository;
import com.privod.platform.modules.iot.repository.IoTDeviceRepository;
import com.privod.platform.modules.iot.repository.IoTSensorDataRepository;
import com.privod.platform.modules.iot.web.dto.CreateDeviceRequest;
import com.privod.platform.modules.iot.web.dto.IngestSensorDataRequest;
import com.privod.platform.modules.iot.web.dto.IoTAlertResponse;
import com.privod.platform.modules.iot.web.dto.IoTDeviceResponse;
import com.privod.platform.modules.iot.web.dto.IoTSensorDataResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IoTDeviceService {

    private final IoTDeviceRepository deviceRepository;
    private final IoTSensorDataRepository sensorDataRepository;
    private final IoTAlertRepository alertRepository;
    private final IoTAlertRuleRepository alertRuleRepository;
    private final AuditService auditService;

    // ---- Devices ----

    @Transactional(readOnly = true)
    public Page<IoTDeviceResponse> findAllDevices(UUID projectId, DeviceStatus status, Pageable pageable) {
        if (projectId != null) {
            return deviceRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(IoTDeviceResponse::fromEntity);
        }
        if (status != null) {
            return deviceRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(IoTDeviceResponse::fromEntity);
        }
        return deviceRepository.findByDeletedFalse(pageable).map(IoTDeviceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IoTDeviceResponse findDeviceById(UUID id) {
        IoTDevice device = getDeviceOrThrow(id);
        return IoTDeviceResponse.fromEntity(device);
    }

    @Transactional
    public IoTDeviceResponse createDevice(CreateDeviceRequest request) {
        String code = generateDeviceCode();

        IoTDevice device = IoTDevice.builder()
                .code(code)
                .name(request.name())
                .deviceType(request.deviceType())
                .serialNumber(request.serialNumber())
                .projectId(request.projectId())
                .location(request.location())
                .installationDate(request.installationDate())
                .firmwareVersion(request.firmwareVersion())
                .status(DeviceStatus.OFFLINE)
                .build();

        device = deviceRepository.save(device);
        auditService.logCreate("IoTDevice", device.getId());

        log.info("IoT device created: {} - {} ({})", device.getCode(), device.getName(), device.getId());
        return IoTDeviceResponse.fromEntity(device);
    }

    @Transactional
    public IoTDeviceResponse updateDevice(UUID id, CreateDeviceRequest request) {
        IoTDevice device = getDeviceOrThrow(id);

        if (request.name() != null) device.setName(request.name());
        if (request.deviceType() != null) device.setDeviceType(request.deviceType());
        if (request.serialNumber() != null) device.setSerialNumber(request.serialNumber());
        if (request.projectId() != null) device.setProjectId(request.projectId());
        if (request.location() != null) device.setLocation(request.location());
        if (request.installationDate() != null) device.setInstallationDate(request.installationDate());
        if (request.firmwareVersion() != null) device.setFirmwareVersion(request.firmwareVersion());

        device = deviceRepository.save(device);
        auditService.logUpdate("IoTDevice", device.getId(), "multiple", null, null);

        log.info("IoT device updated: {} - {} ({})", device.getCode(), device.getName(), device.getId());
        return IoTDeviceResponse.fromEntity(device);
    }

    @Transactional
    public void deleteDevice(UUID id) {
        IoTDevice device = getDeviceOrThrow(id);
        device.softDelete();
        deviceRepository.save(device);
        auditService.logDelete("IoTDevice", id);
        log.info("IoT device soft-deleted: {} ({})", device.getCode(), id);
    }

    // ---- Sensor Data ----

    @Transactional
    public IoTSensorDataResponse ingestData(IngestSensorDataRequest request) {
        IoTDevice device = getDeviceOrThrow(request.deviceId());

        IoTSensorData data = IoTSensorData.builder()
                .deviceId(request.deviceId())
                .timestamp(request.timestamp() != null ? request.timestamp() : Instant.now())
                .metricName(request.metricName())
                .metricValue(request.metricValue())
                .unit(request.unit())
                .isAnomaly(false)
                .build();

        // Check alert rules
        List<IoTAlertRule> rules = alertRuleRepository
                .findByDeviceTypeAndIsActiveTrueAndDeletedFalse(device.getDeviceType());

        boolean anomaly = false;
        for (IoTAlertRule rule : rules) {
            if (rule.getMetricName().equals(request.metricName()) && isRuleViolated(rule, request.metricValue())) {
                anomaly = true;
                IoTAlert alert = IoTAlert.builder()
                        .deviceId(device.getId())
                        .alertType(AlertType.THRESHOLD_EXCEEDED)
                        .severity(rule.getSeverity())
                        .message(String.format("Metric '%s' value %.2f violated rule (condition=%s, threshold=%.2f)",
                                request.metricName(), request.metricValue(),
                                rule.getCondition(), rule.getThresholdValue()))
                        .thresholdValue(rule.getThresholdValue())
                        .actualValue(request.metricValue())
                        .status(AlertStatus.ACTIVE)
                        .build();
                alertRepository.save(alert);
                log.warn("Alert triggered for device {}: {}", device.getCode(), alert.getMessage());
            }
        }

        data.setIsAnomaly(anomaly);
        data = sensorDataRepository.save(data);

        // Update device last data time and status
        device.setLastDataAt(data.getTimestamp());
        if (device.getStatus() == DeviceStatus.OFFLINE) {
            device.setStatus(DeviceStatus.ONLINE);
        }
        deviceRepository.save(device);

        log.debug("Sensor data ingested for device {}: {}={}", device.getCode(), request.metricName(), request.metricValue());
        return IoTSensorDataResponse.fromEntity(data);
    }

    @Transactional(readOnly = true)
    public Page<IoTSensorDataResponse> findSensorData(UUID deviceId, Pageable pageable) {
        return sensorDataRepository.findByDeviceIdAndDeletedFalse(deviceId, pageable)
                .map(IoTSensorDataResponse::fromEntity);
    }

    // ---- Alerts ----

    @Transactional(readOnly = true)
    public Page<IoTAlertResponse> findAlerts(UUID deviceId, AlertStatus status, Pageable pageable) {
        if (deviceId != null) {
            return alertRepository.findByDeviceIdAndDeletedFalse(deviceId, pageable)
                    .map(IoTAlertResponse::fromEntity);
        }
        if (status != null) {
            return alertRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(IoTAlertResponse::fromEntity);
        }
        return alertRepository.findByDeletedFalse(pageable).map(IoTAlertResponse::fromEntity);
    }

    @Transactional
    public IoTAlertResponse acknowledgeAlert(UUID alertId, UUID userId) {
        IoTAlert alert = alertRepository.findByIdAndDeletedFalse(alertId)
                .orElseThrow(() -> new EntityNotFoundException("IoT alert not found: " + alertId));

        alert.setStatus(AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedById(userId);
        alert = alertRepository.save(alert);
        auditService.logStatusChange("IoTAlert", alertId, "ACTIVE", "ACKNOWLEDGED");

        log.info("IoT alert acknowledged: {}", alertId);
        return IoTAlertResponse.fromEntity(alert);
    }

    @Transactional
    public IoTAlertResponse resolveAlert(UUID alertId) {
        IoTAlert alert = alertRepository.findByIdAndDeletedFalse(alertId)
                .orElseThrow(() -> new EntityNotFoundException("IoT alert not found: " + alertId));

        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(Instant.now());
        alert = alertRepository.save(alert);
        auditService.logStatusChange("IoTAlert", alertId, alert.getStatus().name(), "RESOLVED");

        log.info("IoT alert resolved: {}", alertId);
        return IoTAlertResponse.fromEntity(alert);
    }

    // ---- Private helpers ----

    private boolean isRuleViolated(IoTAlertRule rule, Double value) {
        return switch (rule.getCondition()) {
            case GT -> value > rule.getThresholdValue();
            case LT -> value < rule.getThresholdValue();
            case EQ -> Math.abs(value - rule.getThresholdValue()) < 0.001;
            case BETWEEN -> rule.getThresholdValue2() != null
                    && (value < rule.getThresholdValue() || value > rule.getThresholdValue2());
        };
    }

    private IoTDevice getDeviceOrThrow(UUID id) {
        return deviceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("IoT device not found: " + id));
    }

    private String generateDeviceCode() {
        long count = deviceRepository.count();
        return String.format("IOT-%06d", count + 1);
    }
}
