package com.privod.platform.modules.ops.domain;

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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "shift_handovers", indexes = {
        @Index(name = "idx_sh_project", columnList = "project_id"),
        @Index(name = "idx_sh_handover_date", columnList = "handover_date"),
        @Index(name = "idx_sh_from_leader", columnList = "from_shift_leader_id"),
        @Index(name = "idx_sh_to_leader", columnList = "to_shift_leader_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftHandover extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "from_shift_leader_id")
    private UUID fromShiftLeaderId;

    @Column(name = "to_shift_leader_id")
    private UUID toShiftLeaderId;

    @Column(name = "handover_date", nullable = false)
    private LocalDate handoverDate;

    @Column(name = "open_items", columnDefinition = "JSONB")
    private String openItems;

    @Column(name = "equipment_status", columnDefinition = "JSONB")
    private String equipmentStatus;

    @Column(name = "safety_notes", columnDefinition = "TEXT")
    private String safetyNotes;

    @Column(name = "acknowledged", nullable = false)
    @Builder.Default
    private boolean acknowledged = false;
}
