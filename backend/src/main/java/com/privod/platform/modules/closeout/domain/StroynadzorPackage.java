package com.privod.platform.modules.closeout.domain;

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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stroynadzor_packages", indexes = {
        @Index(name = "idx_sp_org", columnList = "organization_id"),
        @Index(name = "idx_sp_project", columnList = "project_id"),
        @Index(name = "idx_sp_status", columnList = "status"),
        @Index(name = "idx_sp_wbs", columnList = "wbs_node_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StroynadzorPackage extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "wbs_node_id")
    private UUID wbsNodeId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private StroynadzorPackageStatus status = StroynadzorPackageStatus.DRAFT;

    @Column(name = "completeness_pct", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal completenessPct = BigDecimal.ZERO;

    @Column(name = "total_documents")
    @Builder.Default
    private int totalDocuments = 0;

    @Column(name = "missing_documents")
    @Builder.Default
    private int missingDocuments = 0;

    @Column(name = "missing_documents_json", columnDefinition = "TEXT")
    private String missingDocumentsJson;

    @Column(name = "toc_json", columnDefinition = "TEXT")
    private String tocJson;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "generated_at")
    private Instant generatedAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "sent_to", length = 500)
    private String sentTo;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
