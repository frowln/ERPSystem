package com.privod.platform.modules.ops.domain;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "weather_records", indexes = {
        @Index(name = "idx_wr_project", columnList = "project_id"),
        @Index(name = "idx_wr_record_date", columnList = "record_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherRecord extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "temperature", precision = 5, scale = 1)
    private BigDecimal temperature;

    @Column(name = "humidity", precision = 5, scale = 1)
    private BigDecimal humidity;

    @Column(name = "wind_speed", precision = 5, scale = 1)
    private BigDecimal windSpeed;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition", length = 30)
    private WeatherCondition condition;

    @Column(name = "precipitation", precision = 6, scale = 1)
    private BigDecimal precipitation;

    @Column(name = "is_workable", nullable = false)
    @Builder.Default
    private boolean workable = true;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
