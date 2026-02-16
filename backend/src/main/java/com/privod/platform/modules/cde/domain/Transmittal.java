package com.privod.platform.modules.cde.domain;

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
@Table(name = "cde_transmittals", indexes = {
        @Index(name = "idx_cde_transmittal_project", columnList = "project_id"),
        @Index(name = "idx_cde_transmittal_status", columnList = "status"),
        @Index(name = "idx_cde_transmittal_deleted", columnList = "deleted")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transmittal extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "transmittal_number", nullable = false, length = 100)
    private String transmittalNumber;

    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", length = 30)
    private TransmittalPurpose purpose;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TransmittalStatus status = TransmittalStatus.DRAFT;

    @Column(name = "from_organization_id")
    private UUID fromOrganizationId;

    @Column(name = "to_organization_id")
    private UUID toOrganizationId;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "acknowledged_date")
    private LocalDate acknowledgedDate;

    @Column(name = "cover_note", columnDefinition = "TEXT")
    private String coverNote;

    @Column(name = "sent_by_id")
    private UUID sentById;
}
