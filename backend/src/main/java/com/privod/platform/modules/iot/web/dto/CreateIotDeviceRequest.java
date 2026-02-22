package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.IotDeviceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateIotDeviceRequest(
        @NotBlank(message = "Серийный номер устройства обязателен")
        @Size(max = 100, message = "Серийный номер не должен превышать 100 символов")
        String deviceSerial,

        @NotNull(message = "Тип устройства обязателен")
        IotDeviceType deviceType,

        UUID equipmentId,

        @NotBlank(message = "Название устройства обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @Size(max = 255, message = "Производитель не должен превышать 255 символов")
        String manufacturer,

        @Size(max = 255, message = "Модель не должна превышать 255 символов")
        String model,

        @Size(max = 100, message = "Версия прошивки не должна превышать 100 символов")
        String firmwareVersion
) {
}
