package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.IotEquipmentDevice;
import com.privod.platform.modules.iot.domain.IotDeviceType;

import java.time.Instant;
import java.util.UUID;

public record IotEquipmentDeviceResponse(
        UUID id,
        UUID organizationId,
        String deviceSerial,
        IotDeviceType deviceType,
        String deviceTypeDisplayName,
        UUID equipmentId,
        String name,
        String manufacturer,
        String model,
        String firmwareVersion,
        boolean active,
        Instant lastSeenAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static IotEquipmentDeviceResponse fromEntity(IotEquipmentDevice device) {
        return new IotEquipmentDeviceResponse(
                device.getId(),
                device.getOrganizationId(),
                device.getDeviceSerial(),
                device.getDeviceType(),
                device.getDeviceType().getDisplayName(),
                device.getEquipmentId(),
                device.getName(),
                device.getManufacturer(),
                device.getModel(),
                device.getFirmwareVersion(),
                device.isActive(),
                device.getLastSeenAt(),
                device.getCreatedAt(),
                device.getUpdatedAt(),
                device.getCreatedBy()
        );
    }
}
