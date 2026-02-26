package com.privod.platform.modules.integration.pricing.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler hook for future auto-import of Minstroy quarterly indices.
 * Keeps rollout safe now while providing an explicit extension point.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(
        name = "app.pricing.minstroy.auto-import.enabled",
        havingValue = "true",
        matchIfMissing = false
)
public class MinstroyQuarterlyIndexScheduler {

    @Scheduled(cron = "${app.pricing.minstroy.auto-import.cron:0 0 3 1 * *}")
    public void runAutoImportHook() {
        log.info("Minstroy quarterly auto-import hook triggered. Configure external source integration to enable ingestion.");
    }
}
