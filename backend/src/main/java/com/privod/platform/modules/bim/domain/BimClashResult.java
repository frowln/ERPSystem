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
@Table(name = "bim_clash_results", indexes = {
        @Index(name = "idx_bim_clash_result_org", columnList = "organization_id"),
        @Index(name = "idx_bim_clash_result_test", columnList = "clash_test_id"),
        @Index(name = "idx_bim_clash_result_status", columnList = "status"),
        @Index(name = "idx_bim_clash_result_type", columnList = "clash_type"),
        @Index(name = "idx_bim_clash_result_assigned", columnList = "assigned_to_user_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimClashResult extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "clash_test_id", nullable = false)
    private UUID clashTestId;

    @Column(name = "element_a_guid", nullable = false, length = 255)
    private String elementAGuid;

    @Column(name = "element_a_name", length = 500)
    private String elementAName;

    @Column(name = "element_a_type", length = 255)
    private String elementAType;

    @Column(name = "element_b_guid", nullable = false, length = 255)
    private String elementBGuid;

    @Column(name = "element_b_name", length = 500)
    private String elementBName;

    @Column(name = "element_b_type", length = 255)
    private String elementBType;

    @Enumerated(EnumType.STRING)
    @Column(name = "clash_type", nullable = false, length = 30)
    @Builder.Default
    private ClashType clashType = ClashType.HARD;

    @Column(name = "clash_point_x")
    private Double clashPointX;

    @Column(name = "clash_point_y")
    private Double clashPointY;

    @Column(name = "clash_point_z")
    private Double clashPointZ;

    @Column(name = "distance_mm")
    private Double distanceMm;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ClashResultStatus status = ClashResultStatus.NEW;

    @Column(name = "assigned_to_user_id")
    private UUID assignedToUserId;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;
}
