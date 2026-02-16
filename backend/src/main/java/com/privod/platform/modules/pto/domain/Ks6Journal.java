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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "ks6_journals", indexes = {
        @Index(name = "idx_ks6_project", columnList = "project_id"),
        @Index(name = "idx_ks6_status", columnList = "status"),
        @Index(name = "idx_ks6_responsible", columnList = "responsible_engineer_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ks6Journal extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "responsible_engineer_id")
    private UUID responsibleEngineerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private Ks6JournalStatus status = Ks6JournalStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
