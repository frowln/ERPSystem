package com.privod.platform.modules.calendar.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddAttendeeRequest(
        @NotNull(message = "Идентификатор пользователя обязателен")
        UUID userId,

        @NotBlank(message = "Имя пользователя обязательно")
        String userName,

        @Email(message = "Некорректный формат email")
        String email,

        boolean isRequired
) {
}
