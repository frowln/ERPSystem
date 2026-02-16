package com.privod.platform.modules.organization.web.dto;

import com.privod.platform.modules.organization.domain.Organization;
import com.privod.platform.modules.organization.domain.OrganizationType;

import java.time.Instant;
import java.util.UUID;

public record OrganizationResponse(
        UUID id,
        String name,
        String inn,
        String kpp,
        String ogrn,
        String legalAddress,
        String actualAddress,
        String phone,
        String email,
        OrganizationType type,
        UUID parentId,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static OrganizationResponse fromEntity(Organization org) {
        return new OrganizationResponse(
                org.getId(),
                org.getName(),
                org.getInn(),
                org.getKpp(),
                org.getOgrn(),
                org.getLegalAddress(),
                org.getActualAddress(),
                org.getPhone(),
                org.getEmail(),
                org.getType(),
                org.getParentId(),
                org.isActive(),
                org.getCreatedAt(),
                org.getUpdatedAt()
        );
    }
}
