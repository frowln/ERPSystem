package com.privod.platform.modules.permission.web.dto;

import jakarta.validation.constraints.Size;

public record UpdateRecordRuleRequest(
        @Size(max = 200, message = "Название правила не должно превышать 200 символов")
        String name,

        String domainFilter,

        Boolean permRead,
        Boolean permWrite,
        Boolean permCreate,
        Boolean permUnlink,
        Boolean isGlobal
) {
}
