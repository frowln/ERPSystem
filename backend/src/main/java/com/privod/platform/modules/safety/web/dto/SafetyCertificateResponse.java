package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.SafetyCertificate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SafetyCertificateResponse(
        UUID id,
        UUID employeeId,
        String type,
        String number,
        LocalDate issueDate,
        LocalDate expiryDate,
        String issuingAuthority,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static SafetyCertificateResponse fromEntity(SafetyCertificate entity) {
        return new SafetyCertificateResponse(
                entity.getId(),
                entity.getEmployeeId(),
                entity.getType(),
                entity.getNumber(),
                entity.getIssueDate(),
                entity.getExpiryDate(),
                entity.getIssuingAuthority(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
