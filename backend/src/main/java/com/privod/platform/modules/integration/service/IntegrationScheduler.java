package com.privod.platform.modules.integration.service;

import com.privod.platform.modules.integration.domain.OneCConfig;
import com.privod.platform.modules.integration.domain.OneCExchangeType;
import com.privod.platform.modules.integration.repository.OneCConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled integration jobs for 1C and SBIS sync.
 * Runs every 5 minutes and checks if any config is due for sync.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class IntegrationScheduler {

    private final OneCConfigRepository oneCConfigRepository;
    private final OneCIntegrationService oneCIntegrationService;
    private final SbisService sbisService;

    @Scheduled(fixedDelayString = "${app.integration.sync-check-interval-ms:300000}")
    public void checkOneCSync() {
        try {
            List<OneCConfig> activeConfigs = oneCConfigRepository.findAll().stream()
                    .filter(c -> !c.isDeleted() && c.isActive())
                    .toList();

            for (OneCConfig config : activeConfigs) {
                if (isDueForSync(config.getLastSyncAt(), config.getSyncIntervalMinutes())) {
                    log.info("Запуск запланированной синхронизации 1С для конфигурации: {} ({})",
                            config.getName(), config.getId());
                    try {
                        oneCIntegrationService.startExchange(
                                config.getId(), OneCExchangeType.FULL, null);
                        log.info("Запланированная синхронизация 1С завершена для: {}", config.getName());
                    } catch (Exception e) {
                        log.error("Ошибка запланированной синхронизации 1С для {}: {}",
                                config.getName(), e.getMessage(), e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Ошибка проверки расписания синхронизации 1С: {}", e.getMessage(), e);
        }
    }

    @Scheduled(fixedDelayString = "${app.integration.sbis-sync-interval-ms:900000}")
    public void checkSbisSync() {
        try {
            sbisService.syncDocuments();
        } catch (IllegalStateException e) {
            // No active SBIS config - this is normal
            log.debug("Пропуск синхронизации СБИС: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Ошибка запланированной синхронизации СБИС: {}", e.getMessage(), e);
        }
    }

    private boolean isDueForSync(Instant lastSyncAt, int syncIntervalMinutes) {
        if (lastSyncAt == null) {
            return true; // Never synced, should sync now
        }
        Instant nextSyncDue = lastSyncAt.plus(syncIntervalMinutes, ChronoUnit.MINUTES);
        return Instant.now().isAfter(nextSyncDue);
    }
}
