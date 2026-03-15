package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Weekly digest job that sends a summary email to each active user every Monday at 09:00 Moscow time.
 *
 * <p>Digest includes:
 * <ul>
 *   <li>Tasks due this week</li>
 *   <li>Overdue tasks</li>
 *   <li>Safety incidents from the past week</li>
 *   <li>Pending approvals</li>
 *   <li>Expiring contracts</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class WeeklyDigestJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 9 * * MON", zone = "Europe/Moscow")
    public void sendWeeklyDigest() {
        long start = System.currentTimeMillis();
        log.info("[WeeklyDigestJob] START - Generating weekly digests");

        try {
            // Get all active users with email
            var users = jdbcTemplate.queryForList(
                    """
                    SELECT id, email, first_name, full_name
                    FROM users
                    WHERE deleted = false
                      AND enabled = true
                      AND email IS NOT NULL
                      AND email != ''
                    """
            );

            log.info("[WeeklyDigestJob] Found {} users for digest", users.size());

            int sent = 0;
            int skipped = 0;

            for (var user : users) {
                try {
                    UUID userId = (UUID) user.get("id");
                    String email = (String) user.get("email");
                    String firstName = (String) user.get("first_name");
                    String fullName = (String) user.get("full_name");
                    String displayName = firstName != null ? firstName : (fullName != null ? fullName : "");

                    DigestData digest = buildDigest(userId);

                    if (!digest.hasContent()) {
                        skipped++;
                        continue;
                    }

                    Map<String, Object> variables = new HashMap<>();
                    variables.put("userName", displayName);
                    variables.put("tasksDue", digest.tasksDue);
                    variables.put("tasksOverdue", digest.tasksOverdue);
                    variables.put("safetyIncidents", digest.safetyIncidents);
                    variables.put("pendingApprovals", digest.pendingApprovals);
                    variables.put("expiringContracts", digest.expiringContracts);
                    variables.put("totalItems", digest.totalItems());

                    emailService.sendEmailAsync(
                            email,
                            "Еженедельный дайджест — Привод",
                            "email/weekly-digest",
                            variables
                    );
                    sent++;

                    log.debug("[WeeklyDigestJob] Digest sent to {} ({} items)", email, digest.totalItems());

                } catch (Exception e) {
                    log.error("[WeeklyDigestJob] Failed to build/send digest for user {}: {}",
                            user.get("id"), e.getMessage());
                }
            }

            log.info("[WeeklyDigestJob] Sent {} digests, skipped {} (no content)", sent, skipped);

        } catch (Exception e) {
            log.error("[WeeklyDigestJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[WeeklyDigestJob] END - Completed in {} ms", elapsed);
    }

    private DigestData buildDigest(UUID userId) {
        DigestData data = new DigestData();

        // Tasks due this week
        try {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM tasks
                    WHERE assignee_id = ? AND deleted = false
                      AND status NOT IN ('DONE', 'CANCELLED')
                      AND planned_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
                    """,
                    Integer.class, userId
            );
            data.tasksDue = count != null ? count : 0;
        } catch (Exception e) {
            log.debug("[WeeklyDigestJob] Tasks due query failed: {}", e.getMessage());
        }

        // Overdue tasks
        try {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM tasks
                    WHERE assignee_id = ? AND deleted = false
                      AND planned_end_date < CURRENT_DATE
                      AND status NOT IN ('DONE', 'CANCELLED')
                    """,
                    Integer.class, userId
            );
            data.tasksOverdue = count != null ? count : 0;
        } catch (Exception e) {
            log.debug("[WeeklyDigestJob] Overdue tasks query failed: {}", e.getMessage());
        }

        // Safety incidents this week (global, not per-user)
        try {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM safety_incidents
                    WHERE deleted = false
                      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
                    """,
                    Integer.class
            );
            data.safetyIncidents = count != null ? count : 0;
        } catch (Exception e) {
            log.debug("[WeeklyDigestJob] Safety incidents query failed: {}", e.getMessage());
        }

        // Pending approvals for this user
        try {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM approval_instances
                    WHERE deleted = false
                      AND status = 'PENDING'
                      AND current_approver_id = ?
                    """,
                    Integer.class, userId
            );
            data.pendingApprovals = count != null ? count : 0;
        } catch (Exception e) {
            log.debug("[WeeklyDigestJob] Pending approvals query failed: {}", e.getMessage());
        }

        // Contracts expiring within 14 days (global)
        try {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM contracts
                    WHERE deleted = false
                      AND status = 'ACTIVE'
                      AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 14
                    """,
                    Integer.class
            );
            data.expiringContracts = count != null ? count : 0;
        } catch (Exception e) {
            log.debug("[WeeklyDigestJob] Expiring contracts query failed: {}", e.getMessage());
        }

        return data;
    }

    /**
     * Holds aggregated digest metrics for a single user.
     */
    static class DigestData {
        int tasksDue = 0;
        int tasksOverdue = 0;
        int safetyIncidents = 0;
        int pendingApprovals = 0;
        int expiringContracts = 0;

        boolean hasContent() {
            return tasksDue > 0 || tasksOverdue > 0 || safetyIncidents > 0
                    || pendingApprovals > 0 || expiringContracts > 0;
        }

        int totalItems() {
            return tasksDue + tasksOverdue + safetyIncidents + pendingApprovals + expiringContracts;
        }
    }
}
