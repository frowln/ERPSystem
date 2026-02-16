package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.ContractLegalTemplate;
import com.privod.platform.modules.legal.domain.LegalTemplateType;

import java.time.Instant;
import java.util.UUID;

public record ContractLegalTemplateResponse(
        UUID id,
        String name,
        LegalTemplateType templateType,
        String templateTypeDisplayName,
        String category,
        String content,
        String variables,
        boolean active,
        int templateVersion,
        Instant createdAt,
        Instant updatedAt
) {
    public static ContractLegalTemplateResponse fromEntity(ContractLegalTemplate t) {
        return new ContractLegalTemplateResponse(
                t.getId(),
                t.getName(),
                t.getTemplateType(),
                t.getTemplateType().getDisplayName(),
                t.getCategory(),
                t.getContent(),
                t.getVariables(),
                t.isActive(),
                t.getTemplateVersion(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
