package com.privod.platform.modules.maintenance.domain;

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
@Table(name = "preventive_schedules", indexes = {
        @Index(name = "idx_prev_sched_equipment", columnList = "equipment_id"),
        @Index(name = "idx_prev_sched_team", columnList = "maintenance_team_id"),
        @Index(name = "idx_prev_sched_next_exec", columnList = "next_execution"),
        @Index(name = "idx_prev_sched_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreventiveSchedule extends BaseEntity {

    @Column(name = "equipment_id", nullable = false)
    private UUID equipmentId;

    @Column(name = "maintenance_team_id")
    private UUID maintenanceTeamId;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency_type", nullable = false, length = 10)
    private FrequencyType frequencyType;

    @Column(name = "frequency_interval", nullable = false)
    private int frequencyInterval;

    @Column(name = "next_execution")
    private LocalDate nextExecution;

    @Column(name = "last_execution")
    private LocalDate lastExecution;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
