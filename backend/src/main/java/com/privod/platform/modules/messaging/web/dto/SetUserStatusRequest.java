package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.AvailabilityStatus;
import jakarta.validation.constraints.Size;

public record SetUserStatusRequest(
        @Size(max = 500, message = "Текст статуса не должен превышать 500 символов")
        String statusText,

        @Size(max = 50, message = "Эмодзи статуса не должен превышать 50 символов")
        String statusEmoji,

        AvailabilityStatus availabilityStatus
) {
}
