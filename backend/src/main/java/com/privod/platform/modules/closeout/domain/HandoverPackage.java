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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "handover_packages", indexes = {
        @Index(name = "idx_handover_project", columnList = "project_id"),
        @Index(name = "idx_handover_status", columnList = "status"),
        @Index(name = "idx_handover_prepared_by", columnList = "prepared_by_id"),
        @Index(name = "idx_handover_accepted_by", columnList = "accepted_by_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandoverPackage extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "package_number", length = 50)
    private String packageNumber;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private HandoverStatus status = HandoverStatus.DRAFT;

    @Column(name = "recipient_organization", length = 500)
    private String recipientOrganization;

    @Column(name = "recipient_contact_id")
    private UUID recipientContactId;

    @Column(name = "prepared_by_id")
    private UUID preparedById;

    @Column(name = "prepared_date")
    private LocalDate preparedDate;

    @Column(name = "handover_date")
    private LocalDate handoverDate;

    @Column(name = "accepted_date")
    private LocalDate acceptedDate;

    @Column(name = "accepted_by_id")
    private UUID acceptedById;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "document_ids", columnDefinition = "JSONB")
    private String documentIds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "drawing_ids", columnDefinition = "JSONB")
    private String drawingIds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "certificate_ids", columnDefinition = "JSONB")
    private String certificateIds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "manual_ids", columnDefinition = "JSONB")
    private String manualIds;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
}
