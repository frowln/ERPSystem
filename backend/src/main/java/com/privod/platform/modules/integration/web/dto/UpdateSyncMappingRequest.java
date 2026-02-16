package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.MappingDirection;
import jakarta.validation.constraints.Size;

public record UpdateSyncMappingRequest(
        @Size(max = 100, message = "Локальное имя поля не должно превышать 100 символов")
        String localFieldName,

        @Size(max = 100, message = "Удалённое имя поля не должно превышать 100 символов")
        String remoteFieldName,

        @Size(max = 500, message = "Выражение трансформации не должно превышать 500 символов")
        String transformExpression,

        MappingDirection direction,

        Boolean isRequired
) {
}
