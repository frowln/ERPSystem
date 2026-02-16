package com.privod.platform.modules.cde.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateRevisionSetRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название набора ревизий обязательно")
        @Size(max = 300, message = "Название не должно превышать 300 символов")
        String name,

        String description,

        String revisionIds,

        LocalDate issuedDate,

        UUID issuedById
) {
}
