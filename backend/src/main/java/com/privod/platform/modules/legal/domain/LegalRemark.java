package com.privod.platform.modules.legal.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "legal_remarks", indexes = {
        @Index(name = "idx_legal_remark_case", columnList = "case_id"),
        @Index(name = "idx_legal_remark_author", columnList = "author_id"),
        @Index(name = "idx_legal_remark_type", columnList = "remark_type"),
        @Index(name = "idx_legal_remark_date", columnList = "remark_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegalRemark extends BaseEntity {

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "remark_date", nullable = false)
    private LocalDate remarkDate;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "remark_type", nullable = false, length = 30)
    private RemarkType remarkType;

    @Column(name = "is_confidential", nullable = false)
    @Builder.Default
    private boolean confidential = false;
}
