package com.privod.platform.modules.settings.web.dto;

import java.util.UUID;

public record CustomFieldValueResponse(
        UUID definitionId,
        String fieldKey,
        String fieldName,
        String fieldType,
        Object value,
        String entityType
) {
}
