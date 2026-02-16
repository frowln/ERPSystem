package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Checks fleet maintenance schedules daily at 07:00.
 * Sends reminders for vehicles/equipment due for maintenance within 7 days.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class FleetMaintenanceJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 7 * * *")
    public void checkMaintenanceSchedule() {
        long start = System.currentTimeMillis();
        log.info("[FleetMaintenanceJob] START - Checking fleet maintenance schedules");

        try {
            LocalDate today = LocalDate.now();
            LocalDate threshold = today.plusDays(7);

            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT v.id, v.registration_number, v.name AS vehicle_name,
                           v.vehicle_type, v.next_maintenance_date,
                           u.email AS operator_email, u.full_name AS operator_name
                    FROM vehicles v
                    LEFT JOIN users u ON u.id = v.operator_id
                    WHERE v.deleted = false
                      AND v.status = 'ACTIVE'
                      AND v.next_maintenance_date BETWEEN ? AND ?
                    ORDER BY v.next_maintenance_date ASC
                    """,
                    today, threshold
            );

            log.info("[FleetMaintenanceJob] Found {} vehicles due for maintenance within 7 days", rows.size());

            for (var row : rows) {
                try {
                    String email = (String) row.get("operator_email");
                    if (email == null || email.isBlank()) {
                        log.debug("[FleetMaintenanceJob] No operator email for vehicle {}",
                                row.get("registration_number"));
                        continue;
                    }

                    LocalDate maintenanceDate = ((java.sql.Date) row.get("next_maintenance_date")).toLocalDate();
                    long daysLeft = ChronoUnit.DAYS.between(today, maintenanceDate);
                    String vehicleName = (String) row.getOrDefault("vehicle_name", "");
                    String regNumber = (String) row.getOrDefault("registration_number", "");

                    emailService.sendEmailAsync(
                            email,
                            String.format("Техобслуживание %s (%s) через %d дн.", vehicleName, regNumber, daysLeft),
                            "email/safety-inspection-reminder",
                            Map.of(
                                    "inspectionType", "Плановое ТО",
                                    "scheduledDate", maintenanceDate.format(DATE_FMT),
                                    "overdueDays", 0,
                                    "location", String.format("%s (%s)", vehicleName, regNumber),
                                    "projectName", row.getOrDefault("vehicle_type", ""),
                                    "inspectorName", row.getOrDefault("operator_name", ""),
                                    "inspectionId", row.get("id").toString()
                            )
                    );
                } catch (Exception e) {
                    log.error("[FleetMaintenanceJob] Error processing vehicle: {}", e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("[FleetMaintenanceJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[FleetMaintenanceJob] END - Completed in {} ms", elapsed);
    }
}
