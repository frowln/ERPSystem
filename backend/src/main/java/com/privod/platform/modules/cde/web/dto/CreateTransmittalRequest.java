package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.TransmittalPurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateTransmittalRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Номер трансмиттала обязателен")
        @Size(max = 100, message = "Номер трансмиттала не должен превышать 100 символов")
        String transmittalNumber,

        @NotBlank(message = "Тема трансмиттала обязательна")
        @Size(max = 500, message = "Тема не должна превышать 500 символов")
        String subject,

        TransmittalPurpose purpose,

        UUID fromOrganizationId,

        UUID toOrganizationId,

        LocalDate dueDate,

        String coverNote
) {
}
