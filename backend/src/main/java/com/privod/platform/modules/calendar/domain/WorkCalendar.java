package com.privod.platform.modules.calendar.domain;

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

import java.util.UUID;

@Entity
@Table(name = "work_calendars", indexes = {
        @Index(name = "idx_work_calendar_year", columnList = "year"),
        @Index(name = "idx_work_calendar_project", columnList = "project_id"),
        @Index(name = "idx_work_calendar_type", columnList = "calendar_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkCalendar extends BaseEntity {

    @Column(name = "year", nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(name = "calendar_type", nullable = false, length = 20)
    @Builder.Default
    private CalendarType calendarType = CalendarType.STANDARD;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;
}
