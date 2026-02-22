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

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "hidden_work_acts", indexes = {
        @Index(name = "idx_hwa_project", columnList = "project_id"),
        @Index(name = "idx_hwa_status", columnList = "status"),
        @Index(name = "idx_hwa_date", columnList = "date"),
        @Index(name = "idx_hwa_inspector", columnList = "inspector_id"),
        @Index(name = "idx_hwa_contractor", columnList = "contractor_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HiddenWorkAct extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "work_description", columnDefinition = "TEXT", nullable = false)
    private String workDescription;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "inspector_id")
    private UUID inspectorId;

    @Column(name = "contractor_id")
    private UUID contractorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private HiddenWorkActStatus status = HiddenWorkActStatus.DRAFT;

    @Column(name = "photo_ids", columnDefinition = "JSONB")
    private String photoIds;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "act_number", length = 50)
    private String actNumber;

    @Column(name = "signed_at")
    private Instant signedAt;
}
