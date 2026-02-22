package com.privod.platform.modules.cde.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs daily at 2 AM to auto-archive expired documents
 * based on enabled archive policies with autoArchive = true.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class ArchiveScheduler {

    private final ArchivePolicyService archivePolicyService;

    @Scheduled(cron = "0 0 2 * * *")
    public void archiveExpiredDocuments() {
        log.info("Starting scheduled auto-archive of expired documents");
        try {
            int count = archivePolicyService.autoArchiveExpiredDocuments();
            log.info("Scheduled auto-archive completed: {} documents archived", count);
        } catch (Exception e) {
            log.error("Scheduled auto-archive failed", e);
        }
    }
}
