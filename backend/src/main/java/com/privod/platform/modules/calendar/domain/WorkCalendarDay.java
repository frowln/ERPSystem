package com.privod.platform.modules.calendar.domain;

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
@Table(name = "work_calendar_days",
        uniqueConstraints = @UniqueConstraint(name = "uq_calendar_date", columnNames = {"calendar_id", "calendar_date"}),
        indexes = {
                @Index(name = "idx_calendar_day_calendar", columnList = "calendar_id"),
                @Index(name = "idx_calendar_day_date", columnList = "calendar_date"),
                @Index(name = "idx_calendar_day_type", columnList = "day_type")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkCalendarDay extends BaseEntity {

    @Column(name = "calendar_id", nullable = false)
    private UUID calendarId;

    @Column(name = "calendar_date", nullable = false)
    private LocalDate calendarDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_type", nullable = false, length = 20)
    private DayType dayType;

    @Column(name = "work_hours", nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal workHours = new BigDecimal("8.00");

    @Column(name = "note", length = 500)
    private String note;
}
