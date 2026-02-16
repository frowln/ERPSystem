package com.privod.platform.modules.contractExt.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "legal_documents", indexes = {
        @Index(name = "idx_legal_doc_case", columnList = "case_id"),
        @Index(name = "idx_legal_doc_type", columnList = "document_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegalDocument extends BaseEntity {

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    @Column(name = "uploaded_by_id")
    private UUID uploadedById;

    @Column(name = "uploaded_at")
    @Builder.Default
    private Instant uploadedAt = Instant.now();
}
