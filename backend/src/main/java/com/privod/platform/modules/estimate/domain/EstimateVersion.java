package com.privod.platform.modules.estimate.domain;

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

import java.util.UUID;

@Entity
@Table(name = "estimate_versions", indexes = {
        @Index(name = "idx_est_ver_estimate", columnList = "estimate_id"),
        @Index(name = "idx_est_ver_parent", columnList = "parent_version_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstimateVersion extends BaseEntity {

    @Column(name = "estimate_id", nullable = false)
    private UUID estimateId;

    @Column(name = "version_number", nullable = false, length = 50)
    private String versionNumber;

    @Column(name = "parent_version_id")
    private UUID parentVersionId;

    @Column(name = "version_data", columnDefinition = "TEXT")
    private String versionData;

    @Column(name = "reason", nullable = false, length = 50)
    private String reason;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "is_current", nullable = false)
    @Builder.Default
    private boolean isCurrent = true;
}
