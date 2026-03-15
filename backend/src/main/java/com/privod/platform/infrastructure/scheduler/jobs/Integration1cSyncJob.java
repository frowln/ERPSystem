package com.privod.platform.infrastructure.scheduler.jobs;

import com.privod.platform.modules.integration1c.domain.Integration1cConfig;
import com.privod.platform.modules.integration1c.service.Integration1cService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled job that automatically syncs data from 1C for all organizations
 * that have syncEnabled=true and whose sync interval has elapsed.
 * <p>
 * Runs every 5 minutes. For each config, checks if enough time has passed
 * since lastSyncAt based on syncIntervalMinutes.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class Integration1cSyncJob {

    private final Integration1cService integration1cService;

    @Scheduled(fixedDelayString = "${app.integration.sync-check-interval-ms:300000}")
    public void syncDueConfigs() {
        List<Integration1cConfig> configs = integration1cService.getConfigsDueForSync();

        for (Integration1cConfig config : configs) {
            if (!isDueForSync(config)) continue;

            try {
                log.info("1C auto-sync triggered for org={} (interval={}min)",
                        config.getOrganizationId(), config.getSyncIntervalMinutes());
                integration1cService.runFullSync(config.getId());
            } catch (Exception e) {
                log.error("1C auto-sync failed for config={}: {}", config.getId(), e.getMessage());
            }
        }
    }

    private boolean isDueForSync(Integration1cConfig config) {
        if (config.getLastSyncAt() == null) return true;

        int intervalMinutes = config.getSyncIntervalMinutes() > 0
                ? config.getSyncIntervalMinutes() : 15;
        Instant nextSync = config.getLastSyncAt().plus(intervalMinutes, ChronoUnit.MINUTES);
        return Instant.now().isAfter(nextSync);
    }
}
