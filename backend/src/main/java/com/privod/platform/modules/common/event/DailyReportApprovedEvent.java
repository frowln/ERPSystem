package com.privod.platform.modules.common.event;

import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Published when a daily site report (суточный рапорт) is approved.
 * Listeners may use this to update project progress, aggregate analytics, trigger notifications, etc.
 */
@Getter
public class DailyReportApprovedEvent extends DomainEvent {

    private final UUID dailyReportId;
    private final UUID projectId;
    private final LocalDate date;

    public DailyReportApprovedEvent(UUID dailyReportId, UUID projectId, LocalDate date) {
        this.dailyReportId = dailyReportId;
        this.projectId = projectId;
        this.date = date;
    }
}
