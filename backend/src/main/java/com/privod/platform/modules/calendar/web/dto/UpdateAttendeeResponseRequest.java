package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.AttendeeResponseStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAttendeeResponseRequest(
        @NotNull(message = "Статус ответа обязателен")
        AttendeeResponseStatus responseStatus
) {
}
