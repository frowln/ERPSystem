package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.DocumentClassification;
import jakarta.validation.constraints.Size;

public record UpdateDocumentContainerRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        String description,

        DocumentClassification classification,

        @Size(max = 100)
        String discipline,

        @Size(max = 100)
        String zone,

        @Size(max = 50)
        String level,

        @Size(max = 50)
        String originatorCode,

        @Size(max = 50)
        String typeCode,

        String metadata,

        String tags
) {
}
