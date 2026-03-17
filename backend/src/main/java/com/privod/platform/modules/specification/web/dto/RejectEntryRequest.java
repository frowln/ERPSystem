package com.privod.platform.modules.specification.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectEntryRequest(
        @NotBlank(message = "Тип отклонения обязателен")
        String rejectionType,

        String rejectionReason
) {
}
