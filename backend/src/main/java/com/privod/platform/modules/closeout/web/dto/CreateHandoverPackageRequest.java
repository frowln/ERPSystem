package com.privod.platform.modules.closeout.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateHandoverPackageRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @Size(max = 50)
        String packageNumber,

        @NotBlank(message = "Заголовок пакета обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        String description,

        @Size(max = 500)
        String recipientOrganization,

        UUID recipientContactId,

        UUID preparedById,

        LocalDate preparedDate,

        LocalDate handoverDate,

        String documentIds,

        String drawingIds,

        String certificateIds,

        String manualIds
) {
}
