package com.privod.platform.modules.hrRussian.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "rotation_schedules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RotationSchedule extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "project_id")
    private UUID projectId;

    /** Начало вахты */
    @Column(name = "shift_start", nullable = false)
    private LocalDate shiftStart;

    /** Конец вахты */
    @Column(name = "shift_end", nullable = false)
    private LocalDate shiftEnd;

    /** Дней на объекте */
    @Column(name = "work_days", nullable = false)
    private Integer workDays;

    /** Дней отдыха */
    @Column(name = "rest_days", nullable = false)
    private Integer restDays;

    /** Вахтовая надбавка в % от тарифа (ст. 302 ТК РФ) */
    @Column(name = "shift_bonus_percent")
    private Double shiftBonusPercent;

    /** Статус: PLANNED, ACTIVE, COMPLETED, CANCELLED */
    @Column(name = "status", length = 30)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RotationStatus status = RotationStatus.PLANNED;

    @Column(name = "notes", length = 1000)
    private String notes;
}
