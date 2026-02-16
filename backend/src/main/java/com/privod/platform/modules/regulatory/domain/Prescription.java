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

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "prescriptions", indexes = {
        @Index(name = "idx_prescription_inspection", columnList = "inspection_id"),
        @Index(name = "idx_prescription_status", columnList = "status"),
        @Index(name = "idx_prescription_deadline", columnList = "deadline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prescription extends BaseEntity {

    @Column(name = "inspection_id")
    private UUID inspectionId;

    @Column(name = "number", length = 50)
    private String number;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PrescriptionStatus status = PrescriptionStatus.OPEN;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "evidence_url", length = 1000)
    private String evidenceUrl;

    @Column(name = "responsible_id")
    private UUID responsibleId;
}
