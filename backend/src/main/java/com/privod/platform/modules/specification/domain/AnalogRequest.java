package com.privod.platform.modules.specification.domain;

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

import java.util.UUID;

@Entity
@Table(name = "analog_requests", indexes = {
        @Index(name = "idx_ar_project", columnList = "project_id"),
        @Index(name = "idx_ar_original_material", columnList = "original_material_id"),
        @Index(name = "idx_ar_status", columnList = "status"),
        @Index(name = "idx_ar_requested_by", columnList = "requested_by_id"),
        @Index(name = "idx_ar_approved_analog", columnList = "approved_analog_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalogRequest extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "original_material_id", nullable = false)
    private UUID originalMaterialId;

    @Column(name = "requested_by_id", nullable = false)
    private UUID requestedById;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private AnalogRequestStatus status = AnalogRequestStatus.PENDING;

    @Column(name = "approved_analog_id")
    private UUID approvedAnalogId;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "review_comment", columnDefinition = "TEXT")
    private String reviewComment;
}
