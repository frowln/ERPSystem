package com.privod.platform.modules.dailylog.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_logs", indexes = {
        @Index(name = "idx_dl_code", columnList = "code", unique = true),
        @Index(name = "idx_dl_project", columnList = "project_id"),
        @Index(name = "idx_dl_log_date", columnList = "log_date"),
        @Index(name = "idx_dl_status", columnList = "status")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_daily_log_project_date", columnNames = {"project_id", "log_date"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyLog extends BaseEntity {

    @Column(name = "code", unique = true, length = 20)
    private String code;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "weather_conditions", nullable = false, length = 20)
    private WeatherCondition weatherConditions;

    @Column(name = "temperature_min", precision = 5, scale = 1)
    private BigDecimal temperatureMin;

    @Column(name = "temperature_max", precision = 5, scale = 1)
    private BigDecimal temperatureMax;

    @Column(name = "wind_speed", precision = 5, scale = 1)
    private BigDecimal windSpeed;

    @Column(name = "shift_supervisor_id")
    private UUID shiftSupervisorId;

    @Column(name = "shift_supervisor_name", length = 255)
    private String shiftSupervisorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DailyLogStatus status = DailyLogStatus.DRAFT;

    @Column(name = "general_notes", columnDefinition = "TEXT")
    private String generalNotes;
}
