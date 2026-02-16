package com.privod.platform.modules.dailylog.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CreateDailyLogPhotoRequest(
        @NotBlank(message = "URL фотографии обязателен")
        @Size(max = 1000, message = "URL фотографии не должен превышать 1000 символов")
        String photoUrl,

        @Size(max = 1000, message = "URL миниатюры не должен превышать 1000 символов")
        String thumbnailUrl,

        @Size(max = 500, message = "Подпись не должна превышать 500 символов")
        String caption,

        Instant takenAt,
        UUID takenById,
        BigDecimal gpsLatitude,
        BigDecimal gpsLongitude
) {
}
