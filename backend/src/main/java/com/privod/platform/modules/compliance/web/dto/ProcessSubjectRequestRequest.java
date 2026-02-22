package com.privod.platform.modules.compliance.web.dto;

import com.privod.platform.modules.compliance.domain.SubjectRequestStatus;
import jakarta.validation.constraints.NotNull;

public record ProcessSubjectRequestRequest(
        @NotNull(message = "Статус обязателен")
        SubjectRequestStatus status,

        String responseText
) {
}
