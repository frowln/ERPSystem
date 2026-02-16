package com.privod.platform.modules.dataExchange.web.dto;

import jakarta.validation.constraints.Size;

public record UpdateImportMappingRequest(
        @Size(max = 500)
        String name,

        @Size(max = 100)
        String entityType,

        String mappingConfig,

        Boolean isDefault
) {
}
