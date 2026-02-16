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
@Table(name = "ks11_acceptance_acts", indexes = {
        @Index(name = "idx_ks11_project", columnList = "project_id"),
        @Index(name = "idx_ks11_status", columnList = "status"),
        @Index(name = "idx_ks11_date", columnList = "date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ks11AcceptanceAct extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "commission_members", columnDefinition = "JSONB")
    private String commissionMembers;

    @Column(name = "decision", columnDefinition = "TEXT")
    private String decision;

    @Column(name = "defects", columnDefinition = "TEXT")
    private String defects;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private Ks11Status status = Ks11Status.DRAFT;
}
