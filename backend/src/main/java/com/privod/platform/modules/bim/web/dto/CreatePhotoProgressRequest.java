package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.WeatherCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CreatePhotoProgressRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название фото обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        @Size(max = 500, message = "Местоположение не должно превышать 500 символов")
        String location,

        @NotBlank(message = "URL фотографии обязателен")
        String photoUrl,

        String thumbnailUrl,
        Double latitude,
        Double longitude,
        Instant takenAt,
        UUID takenById,
        WeatherCondition weatherCondition,
        String description
) {
}
