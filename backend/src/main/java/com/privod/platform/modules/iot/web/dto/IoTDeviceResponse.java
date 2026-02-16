package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.DeviceStatus;
import com.privod.platform.modules.iot.domain.DeviceType;
import com.privod.platform.modules.iot.domain.IoTDevice;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record IoTDeviceResponse(
        UUID id,
        String code,
        String name,
        DeviceType deviceType,
        String deviceTypeDisplayName,
        String serialNumber,
        UUID projectId,
        String location,
        LocalDate installationDate,
        DeviceStatus status,
        String statusDisplayName,
        Instant lastDataAt,
        Integer batteryLevel,
        String firmwareVersion,
        Instant createdAt
) {
    public static IoTDeviceResponse fromEntity(IoTDevice entity) {
        return new IoTDeviceResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDeviceType(),
                entity.getDeviceType().getDisplayName(),
                entity.getSerialNumber(),
                entity.getProjectId(),
                entity.getLocation(),
                entity.getInstallationDate(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getLastDataAt(),
                entity.getBatteryLevel(),
                entity.getFirmwareVersion(),
                entity.getCreatedAt()
        );
    }
}
