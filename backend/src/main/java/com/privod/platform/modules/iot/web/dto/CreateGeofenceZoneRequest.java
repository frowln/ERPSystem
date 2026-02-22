package com.privod.platform.modules.iot.web.dto;

import com.privod.platform.modules.iot.domain.GeofenceZoneType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateGeofenceZoneRequest(
        UUID projectId,

        @NotBlank(message = "Название зоны обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @NotNull(message = "Тип зоны обязателен")
        GeofenceZoneType zoneType,

        String polygonJson,

        Double radiusMeters,
        Double centerLat,
        Double centerLng
) {
}
