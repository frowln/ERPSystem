package com.privod.platform.modules.closeout.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateZosDocumentRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Номер документа обязателен")
        String documentNumber,

        @NotBlank(message = "Заголовок обязателен")
        String title,

        String system,

        String checklistIds,

        LocalDate issuedDate,

        String issuedByName,

        String issuedByOrganization,

        String conclusionText,

        String remarks,

        String attachmentIds
) {
}
