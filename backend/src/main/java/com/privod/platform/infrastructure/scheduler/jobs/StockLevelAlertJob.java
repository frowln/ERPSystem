package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Checks materials below minimum stock level every weekday at 09:00.
 * Alerts warehouse managers about critically low inventory.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(prefix = "app.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class StockLevelAlertJob {

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 9 * * MON-FRI")
    public void checkLowStockLevels() {
        long start = System.currentTimeMillis();
        log.info("[StockLevelAlertJob] START - Checking materials below minimum stock level");

        try {
            var rows = jdbcTemplate.queryForList(
                    """
                    SELECT m.id, m.name AS material_name, m.unit,
                           m.current_stock, m.minimum_stock,
                           w.name AS warehouse_name,
                           w.manager_email
                    FROM materials m
                    LEFT JOIN warehouses w ON w.id = m.warehouse_id
                    WHERE m.deleted = false
                      AND m.current_stock < m.minimum_stock
                      AND m.minimum_stock > 0
                    ORDER BY (m.current_stock::float / NULLIF(m.minimum_stock, 0)) ASC
                    """
            );

            log.info("[StockLevelAlertJob] Found {} materials below minimum stock level", rows.size());

            for (var row : rows) {
                try {
                    String email = (String) row.get("manager_email");
                    if (email == null || email.isBlank()) {
                        continue;
                    }

                    String materialName = (String) row.getOrDefault("material_name", "");
                    BigDecimal currentStock = row.get("current_stock") != null
                            ? new BigDecimal(row.get("current_stock").toString()) : BigDecimal.ZERO;
                    BigDecimal minimumStock = row.get("minimum_stock") != null
                            ? new BigDecimal(row.get("minimum_stock").toString()) : BigDecimal.ZERO;

                    emailService.sendEmailAsync(
                            email,
                            String.format("Низкий уровень запасов: %s", materialName),
                            "email/stock-alert",
                            Map.of(
                                    "materialName", materialName,
                                    "unit", row.getOrDefault("unit", "шт."),
                                    "currentStock", currentStock.toPlainString(),
                                    "minimumStock", minimumStock.toPlainString(),
                                    "warehouseName", row.getOrDefault("warehouse_name", ""),
                                    "materialId", row.get("id").toString()
                            )
                    );
                } catch (Exception e) {
                    log.error("[StockLevelAlertJob] Error processing material: {}", e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("[StockLevelAlertJob] FAILED: {}", e.getMessage(), e);
        }

        long elapsed = System.currentTimeMillis() - start;
        log.info("[StockLevelAlertJob] END - Completed in {} ms", elapsed);
    }
}
