package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.DeviceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateDeviceRequest(
        @NotBlank(message = "Device name is required")
        @Size(max = 500, message = "Name must not exceed 500 characters")
        String name,

        @NotNull(message = "Device type is required")
        DeviceType deviceType,

        @NotBlank(message = "Serial number is required")
        @Size(max = 200, message = "Serial number must not exceed 200 characters")
        String serialNumber,

        UUID projectId,

        @Size(max = 500, message = "Location must not exceed 500 characters")
        String location,

        LocalDate installationDate,

        @Size(max = 100, message = "Firmware version must not exceed 100 characters")
        String firmwareVersion
) {
}
