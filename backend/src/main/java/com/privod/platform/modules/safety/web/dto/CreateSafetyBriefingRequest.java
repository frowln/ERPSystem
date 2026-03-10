package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.BriefingType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateSafetyBriefingRequest(
        UUID projectId,

        @NotNull(message = "Тип инструктажа обязателен")
        BriefingType briefingType,

        @NotNull(message = "Дата проведения обязательна")
        LocalDate briefingDate,

        UUID instructorId,
        String instructorName,
        String topic,
        String notes,

        List<AttendeeRequest> attendees
) {
    public record AttendeeRequest(
            UUID employeeId,
            String employeeName
    ) {}
}
