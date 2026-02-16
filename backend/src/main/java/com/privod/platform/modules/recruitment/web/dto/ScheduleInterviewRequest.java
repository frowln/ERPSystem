package com.privod.platform.modules.recruitment.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record ScheduleInterviewRequest(

        @NotNull(message = "ID кандидата обязателен")
        UUID applicantId,

        UUID interviewerId,

        @NotNull(message = "Дата и время собеседования обязательны")
        LocalDateTime scheduledAt,

        @Min(value = 15, message = "Продолжительность должна быть не менее 15 минут")
        int duration,

        @Size(max = 500)
        String location,

        String notes
) {
}
