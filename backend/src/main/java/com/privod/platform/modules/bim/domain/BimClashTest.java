package com.privod.platform.modules.bim.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bim_clash_tests", indexes = {
        @Index(name = "idx_bim_clash_test_org", columnList = "organization_id"),
        @Index(name = "idx_bim_clash_test_project", columnList = "project_id"),
        @Index(name = "idx_bim_clash_test_status", columnList = "status"),
        @Index(name = "idx_bim_clash_test_model_a", columnList = "model_a_id"),
        @Index(name = "idx_bim_clash_test_model_b", columnList = "model_b_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimClashTest extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "model_a_id", nullable = false)
    private UUID modelAId;

    @Column(name = "model_b_id", nullable = false)
    private UUID modelBId;

    @Column(name = "tolerance_mm", nullable = false)
    @Builder.Default
    private Double toleranceMm = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ClashTestStatus status = ClashTestStatus.PENDING;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "total_clashes_found", nullable = false)
    @Builder.Default
    private Integer totalClashesFound = 0;
}
