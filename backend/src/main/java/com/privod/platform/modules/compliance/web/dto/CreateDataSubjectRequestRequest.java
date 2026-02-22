package com.privod.platform.modules.compliance.web.dto;

import com.privod.platform.modules.compliance.domain.SubjectRequestType;
import jakarta.validation.constraints.NotNull;

public record CreateDataSubjectRequestRequest(
        @NotNull(message = "Тип запроса обязателен")
        SubjectRequestType requestType,

        String description
) {
}
