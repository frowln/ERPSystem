package com.privod.platform.modules.dailylog.domain;

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
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "daily_log_entries", indexes = {
        @Index(name = "idx_dle_daily_log", columnList = "daily_log_id"),
        @Index(name = "idx_dle_entry_type", columnList = "entry_type"),
        @Index(name = "idx_dle_task", columnList = "task_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyLogEntry extends BaseEntity {

    @Column(name = "daily_log_id", nullable = false)
    private UUID dailyLogId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 30)
    private EntryType entryType;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "quantity", precision = 18, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "responsible_name", length = 255)
    private String responsibleName;

    @Column(name = "task_id")
    private UUID taskId;
}
