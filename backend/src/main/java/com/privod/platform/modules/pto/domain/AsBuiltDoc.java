package com.privod.platform.modules.pto.domain;

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
@Table(name = "as_built_docs", indexes = {
        @Index(name = "idx_asbuilt_project", columnList = "project_id"),
        @Index(name = "idx_asbuilt_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsBuiltDoc extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 30)
    private WorkType workType;

    @Column(name = "original_drawing_id")
    private UUID originalDrawingId;

    @Column(name = "asbuilt_url", length = 1000)
    private String asbuiltUrl;

    @Column(name = "deviations", columnDefinition = "TEXT")
    private String deviations;

    @Column(name = "accepted_by_id")
    private UUID acceptedById;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AsBuiltStatus status = AsBuiltStatus.DRAFT;

    public boolean canTransitionTo(AsBuiltStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
