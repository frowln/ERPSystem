package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.SubmissionChannel;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateReportingSubmissionRequest(
        @NotNull(message = "Идентификатор дедлайна обязателен")
        UUID deadlineId,

        @NotNull(message = "Дата подачи обязательна")
        LocalDate submissionDate,

        UUID submittedById,

        @Size(max = 100, message = "Номер подтверждения не должен превышать 100 символов")
        String confirmationNumber,

        SubmissionChannel channel,

        @Size(max = 1000, message = "URL файла не должен превышать 1000 символов")
        String fileUrl
) {
}
