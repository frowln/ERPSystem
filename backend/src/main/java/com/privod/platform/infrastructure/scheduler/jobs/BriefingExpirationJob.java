package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * P1-SAF-1: Tracks safety briefing (инструктаж) expiration daily at 07:00.
 *
 * <p>Two actions are performed:
 * <ol>
 *   <li>Trainings in status PLANNED or IN_PROGRESS whose scheduled {@code date}
 *       is in the past are cancelled — they can no longer be conducted as planned
 *       and must be rescheduled.</li>
 *   <li>Completed trainings whose {@code next_scheduled_date} has passed are
 *       flagged by logging — a follow-up briefing is overdue. No automatic status
 *       change is applied here; the safety officer must act.</li>
 * </ol>
 *
 * <p>This job does NOT block worker assignment directly; the {@code countOverdueTrainings}
 * repository query is used by the SafetyBriefingController to expose that metric to
 * the front-end, which prevents assignment when overdue trainings > 0.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class BriefingExpirationJob {

    private final JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    /**
     * Daily at 07:00 — cancel overdue unstarted/in-progress briefings and
     * report how many periodic next-briefings are past due.
     */
    @Scheduled(cron = "0 0 7 * * *")
    public void expireOverdueBriefings() {
        long start = System.currentTimeMillis();
        log.info("[BriefingExpirationJob] START - Processing overdue safety briefings");

        try {
            LocalDate today = LocalDate.now();

            // ---------------------------------------------------------------
            // Step 1: Cancel briefings that were never completed and whose
            // scheduled date has already passed.
            // ---------------------------------------------------------------
            int cancelled = jdbcTemplate.update(
                    """
                    UPDATE safety_trainings
                       SET status = 'CANCELLED',
                           updated_at = NOW()
                     WHERE deleted = false
                       AND status IN ('PLANNED', 'IN_PROGRESS')
                       AND date < ?
                    """,
                    today
            );

            log.info("[BriefingExpirationJob] Cancelled {} overdue briefing(s) (status PLANNED/IN_PROGRESS, date < {})",
                    cancelled, today.format(DATE_FMT));

            // ---------------------------------------------------------------
            // Step 2: Count completed briefings whose next_scheduled_date is
            // past — these require a repeat briefing to be scheduled.
            // ---------------------------------------------------------------
            Integer overdueRepeat = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                      FROM safety_trainings
                     WHERE deleted = false
                       AND status = 'COMPLETED'
                       AND next_scheduled_date IS NOT NULL
                       AND next_scheduled_date < ?
                    """,
                    Integer.class,
                    today
            );

            if (overdueRepeat != null && overdueRepeat > 0) {
                log.warn("[BriefingExpirationJob] {} periodic briefing(s) have an overdue next_scheduled_date — " +
                        "safety officer action required to reschedule", overdueRepeat);
            } else {
                log.info("[BriefingExpirationJob] No periodic briefings with overdue next_scheduled_date");
            }

        } catch (Exception e) {
            log.error("[BriefingExpirationJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[BriefingExpirationJob] END - Completed in {} ms", elapsed);
    }
}
