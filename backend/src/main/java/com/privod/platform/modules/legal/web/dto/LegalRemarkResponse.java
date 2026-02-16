package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.LegalRemark;
import com.privod.platform.modules.legal.domain.RemarkType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LegalRemarkResponse(
        UUID id,
        UUID caseId,
        UUID authorId,
        LocalDate remarkDate,
        String content,
        RemarkType remarkType,
        String remarkTypeDisplayName,
        boolean confidential,
        Instant createdAt
) {
    public static LegalRemarkResponse fromEntity(LegalRemark r) {
        return new LegalRemarkResponse(
                r.getId(),
                r.getCaseId(),
                r.getAuthorId(),
                r.getRemarkDate(),
                r.getContent(),
                r.getRemarkType(),
                r.getRemarkType().getDisplayName(),
                r.isConfidential(),
                r.getCreatedAt()
        );
    }
}
