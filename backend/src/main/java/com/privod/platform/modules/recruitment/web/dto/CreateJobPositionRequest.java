package com.privod.platform.modules.recruitment.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateJobPositionRequest(

        @NotBlank(message = "Название позиции обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        UUID departmentId,
        String description,
        String requirements,

        @Min(value = 1, message = "Ожидаемое количество сотрудников должно быть не менее 1")
        int expectedEmployees,

        LocalDate deadline
) {
}
