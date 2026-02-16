package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.Min;

public record UpdateAuditSettingRequest(
        Boolean trackCreate,
        Boolean trackUpdate,
        Boolean trackDelete,
        Boolean trackRead,

        @Min(value = 1, message = "Срок хранения должен быть не менее 1 дня")
        Integer retentionDays,

        Boolean isActive
) {
}
