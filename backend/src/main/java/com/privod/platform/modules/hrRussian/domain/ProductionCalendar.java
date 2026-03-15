package com.privod.platform.modules.hrRussian.domain;

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

/**
 * Производственный календарь РФ.
 * <p>
 * Содержит тип каждого дня (рабочий, выходной, праздничный, предпраздничный,
 * перенесённый) и нормативное количество часов.
 * Используется для формирования Т-13, расчёта сверхурочных и отпускных.
 */
@Entity
@Table(name = "production_calendar", indexes = {
        @Index(name = "idx_prod_calendar_date", columnList = "calendar_date"),
        @Index(name = "idx_prod_calendar_year", columnList = "year"),
        @Index(name = "idx_prod_calendar_org", columnList = "organization_id"),
        @Index(name = "idx_prod_calendar_type", columnList = "day_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionCalendar extends BaseEntity {

    @Column(name = "calendar_date", nullable = false)
    private LocalDate calendarDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_type", nullable = false, length = 20)
    private DayType dayType;

    @Column(name = "standard_hours", nullable = false, precision = 4, scale = 1)
    @Builder.Default
    private BigDecimal standardHours = new BigDecimal("8.0");

    @Column(name = "description")
    private String description;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "organization_id")
    private UUID organizationId;
}
