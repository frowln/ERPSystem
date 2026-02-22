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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "zos_documents", indexes = {
        @Index(name = "idx_zos_org", columnList = "organization_id"),
        @Index(name = "idx_zos_project", columnList = "project_id"),
        @Index(name = "idx_zos_status", columnList = "status")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZosDocument extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "document_number", nullable = false, length = 100)
    private String documentNumber;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "system", length = 100)
    private String system;

    @Column(name = "checklist_ids", columnDefinition = "TEXT")
    private String checklistIds;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "issued_by_name", length = 255)
    private String issuedByName;

    @Column(name = "issued_by_organization", length = 255)
    private String issuedByOrganization;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ZosStatus status = ZosStatus.DRAFT;

    @Column(name = "conclusion_text", columnDefinition = "TEXT")
    private String conclusionText;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "attachment_ids", columnDefinition = "TEXT")
    private String attachmentIds;
}
