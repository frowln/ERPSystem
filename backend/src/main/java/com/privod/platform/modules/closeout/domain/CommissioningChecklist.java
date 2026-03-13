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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "commissioning_checklists", indexes = {
        @Index(name = "idx_commissioning_project", columnList = "project_id"),
        @Index(name = "idx_commissioning_status", columnList = "status"),
        @Index(name = "idx_commissioning_system", columnList = "system"),
        @Index(name = "idx_commissioning_inspector", columnList = "inspector_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissioningChecklist extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "system", length = 100)
    private String system;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ChecklistStatus status = ChecklistStatus.NOT_STARTED;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "check_items", columnDefinition = "JSONB")
    private String checkItems;

    @Column(name = "inspector_id")
    private UUID inspectorId;

    @Column(name = "inspection_date")
    private LocalDate inspectionDate;

    @Column(name = "signed_off_by_id")
    private UUID signedOffById;

    @Column(name = "signed_off_at")
    private Instant signedOffAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attachment_ids", columnDefinition = "JSONB")
    private String attachmentIds;
}
