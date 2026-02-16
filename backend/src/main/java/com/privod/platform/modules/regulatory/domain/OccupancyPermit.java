package com.privod.platform.modules.regulatory.domain;

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
@Table(name = "occupancy_permits", indexes = {
        @Index(name = "idx_occupancy_permit_project", columnList = "project_id"),
        @Index(name = "idx_occupancy_permit_status", columnList = "status"),
        @Index(name = "idx_occupancy_permit_number", columnList = "permit_number", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyPermit extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "permit_number", unique = true, length = 100)
    private String permitNumber;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "issued_by", length = 500)
    private String issuedBy;

    @Column(name = "commission_members", columnDefinition = "JSONB")
    private String commissionMembers;

    @Column(name = "conditions", columnDefinition = "JSONB")
    private String conditions;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PermitStatus status = PermitStatus.ACTIVE;
}
