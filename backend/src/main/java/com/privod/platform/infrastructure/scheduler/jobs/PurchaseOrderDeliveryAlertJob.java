package com.privod.platform.infrastructure.scheduler.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * L13: Daily alert for overdue purchase order deliveries.
 *
 * <p>Runs every day at 09:00. Finds purchase orders where:
 * <ul>
 *   <li>expected_delivery_date is before today</li>
 *   <li>status is NOT DELIVERED or CANCELLED</li>
 * </ul>
 *
 * <p>Creates notification_events for responsible users.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class PurchaseOrderDeliveryAlertJob {

    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 9 * * *")
    public void alertOverdueDeliveries() {
        long start = System.currentTimeMillis();
        log.info("[PurchaseOrderDeliveryAlertJob] START - Checking overdue PO deliveries");

        try {
            LocalDate today = LocalDate.now();

            List<Map<String, Object>> overdue = jdbcTemplate.queryForList(
                    """
                    SELECT po.id, po.order_number, po.expected_delivery_date,
                           po.organization_id, po.created_by,
                           po.supplier_id, po.project_id
                      FROM purchase_orders po
                     WHERE po.deleted = false
                       AND po.expected_delivery_date IS NOT NULL
                       AND po.expected_delivery_date < ?
                       AND po.status NOT IN ('DELIVERED', 'CANCELLED')
                    """,
                    today
            );

            if (!overdue.isEmpty()) {
                log.warn("[PurchaseOrderDeliveryAlertJob] {} purchase order(s) with overdue delivery:", overdue.size());
                for (Map<String, Object> row : overdue) {
                    log.warn("  OVERDUE: {} (expected {})",
                            row.get("order_number"), row.get("expected_delivery_date"));
                }
                insertNotificationEvents(overdue);
            } else {
                log.info("[PurchaseOrderDeliveryAlertJob] No overdue deliveries found");
            }

        } catch (Exception e) {
            log.error("[PurchaseOrderDeliveryAlertJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[PurchaseOrderDeliveryAlertJob] END - Completed in {} ms", elapsed);
    }

    private void insertNotificationEvents(List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            try {
                String message = String.format(
                        "Просрочена доставка по заказу %s (ожидалась %s)",
                        row.get("order_number"), row.get("expected_delivery_date")
                );

                jdbcTemplate.update(
                        """
                        INSERT INTO notification_events
                               (id, organization_id, event_type, entity_type, entity_id, message, created_at, deleted)
                        VALUES (gen_random_uuid(), ?, 'PO_DELIVERY_OVERDUE', 'PurchaseOrder', ?, ?, NOW(), false)
                        ON CONFLICT DO NOTHING
                        """,
                        row.get("organization_id"),
                        row.get("id"),
                        message
                );
            } catch (Exception e) {
                log.warn("[PurchaseOrderDeliveryAlertJob] Could not insert notification for PO {}: {}",
                        row.get("order_number"), e.getMessage());
            }
        }
    }
}
