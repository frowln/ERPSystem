package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * L13: Push notification on PO delivery overdue.
 *
 * <p>Runs every weekday at 09:00. Finds purchase orders where:
 * <ul>
 *   <li>expected_delivery_date is before today</li>
 *   <li>status is NOT 'DELIVERED' or 'CANCELLED'</li>
 * </ul>
 *
 * <p>For each overdue PO, creates a notification record for the responsible user
 * via {@link NotificationService} (persisted + pushed via WebSocket).
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DeliveryOverdueAlertJob {

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Scheduled(cron = "0 0 9 * * MON-FRI")
    public void alertOverdueDeliveries() {
        long start = System.currentTimeMillis();
        log.info("[DeliveryOverdueAlertJob] START - Checking overdue PO deliveries");

        try {
            LocalDate today = LocalDate.now();

            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT po.id, po.order_number, po.expected_delivery_date,
                           po.organization_id, po.created_by,
                           po.supplier_id, po.project_id,
                           p.name AS project_name
                      FROM purchase_orders po
                      LEFT JOIN projects p ON p.id = po.project_id
                     WHERE po.deleted = false
                       AND po.expected_delivery_date IS NOT NULL
                       AND po.expected_delivery_date < ?
                       AND po.status NOT IN ('DELIVERED', 'CANCELLED')
                    """,
                    today
            );

            if (rows.isEmpty()) {
                log.info("[DeliveryOverdueAlertJob] No overdue deliveries found");
            } else {
                log.warn("[DeliveryOverdueAlertJob] {} purchase order(s) with overdue delivery", rows.size());

                for (var row : rows) {
                    try {
                        String orderNumber = (String) row.get("order_number");
                        LocalDate expectedDate = row.get("expected_delivery_date") instanceof java.sql.Date sqlDate
                                ? sqlDate.toLocalDate()
                                : (LocalDate) row.get("expected_delivery_date");
                        long overdueDays = ChronoUnit.DAYS.between(expectedDate, today);
                        String projectName = (String) row.getOrDefault("project_name", "");
                        UUID createdBy = (UUID) row.get("created_by");
                        UUID poId = (UUID) row.get("id");

                        if (createdBy == null) {
                            log.warn("[DeliveryOverdueAlertJob] PO {} has no created_by, skipping notification", orderNumber);
                            continue;
                        }

                        String title = String.format("Просрочена доставка: %s", orderNumber != null ? orderNumber : poId.toString());
                        String message = String.format(
                                "Заказ %s%s просрочен на %d дн. (ожидалась доставка: %s)",
                                orderNumber != null ? orderNumber : poId.toString(),
                                projectName != null && !projectName.isBlank() ? " (" + projectName + ")" : "",
                                overdueDays,
                                expectedDate.format(DATE_FMT)
                        );

                        notificationService.send(
                                createdBy,
                                title,
                                message,
                                NotificationType.WARNING,
                                "PurchaseOrder",
                                poId,
                                "/procurement/purchase-orders?selected=" + poId
                        );

                        log.info("[DeliveryOverdueAlertJob] Notification sent for PO {} to user {}",
                                orderNumber, createdBy);
                    } catch (Exception e) {
                        log.error("[DeliveryOverdueAlertJob] Error processing PO {}: {}",
                                row.get("order_number"), e.getMessage(), e);
                    }
                }
            }

        } catch (Exception e) {
            log.error("[DeliveryOverdueAlertJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[DeliveryOverdueAlertJob] END - Completed in {} ms", elapsed);
    }
}
