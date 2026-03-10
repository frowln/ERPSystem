package com.privod.platform.modules.messaging.web.dto;

import jakarta.validation.constraints.NotBlank;

public record GuestJoinCallRequest(
        @NotBlank(message = "Имя гостя обязательно")
        String guestName
) {
}
