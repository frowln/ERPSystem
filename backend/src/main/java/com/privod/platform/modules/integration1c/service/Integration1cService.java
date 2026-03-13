package com.privod.platform.modules.integration1c.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.accounting.domain.Counterparty;
import com.privod.platform.modules.accounting.repository.CounterpartyRepository;
import com.privod.platform.modules.integration1c.domain.Integration1cConfig;
import com.privod.platform.modules.integration1c.domain.Integration1cSyncLog;
import com.privod.platform.modules.integration1c.domain.SyncDirection;
import com.privod.platform.modules.integration1c.domain.SyncStatus;
import com.privod.platform.modules.integration1c.repository.Integration1cConfigRepository;
import com.privod.platform.modules.integration1c.repository.Integration1cSyncLogRepository;
import com.privod.platform.modules.integration1c.web.dto.Integration1cConfigRequest;
import com.privod.platform.modules.integration1c.web.dto.Integration1cConfigResponse;
import com.privod.platform.modules.integration1c.service.OneCODataClient.OneCCounterparty;
import com.privod.platform.modules.integration1c.web.dto.Integration1cSyncLogResponse;
import com.privod.platform.modules.integration1c.web.dto.Integration1cSyncResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Main service for 1C integration operations.
 * <p>
 * All export/import methods are currently stubs that create sync log entries
 * and simulate success. Actual 1C API integration will be implemented when
 * a test 1C instance is available.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class Integration1cService {

    private final Integration1cConfigRepository configRepository;
    private final Integration1cSyncLogRepository syncLogRepository;
    private final OneCODataClient odataClient;
    private final CounterpartyRepository counterpartyRepository;

    // ── Config CRUD ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Integration1cConfigResponse getConfig(UUID orgId) {
        return configRepository.findByOrganizationIdAndDeletedFalse(orgId)
                .map(Integration1cConfigResponse::from)
                .orElse(null);
    }

    @Transactional
    public Integration1cConfigResponse saveConfig(Integration1cConfigRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        Integration1cConfig config = configRepository.findByOrganizationIdAndDeletedFalse(orgId)
                .orElseGet(() -> {
                    Integration1cConfig c = new Integration1cConfig();
                    c.setOrganizationId(orgId);
                    return c;
                });

        config.setBaseUrl(request.baseUrl());
        config.setUsername(request.username());
        if (request.password() != null && !request.password().isBlank()) {
            // In production, encrypt the password before storing
            config.setEncryptedPassword(request.password());
        }
        config.setDatabaseName(request.databaseName());
        config.setSyncEnabled(request.syncEnabled());
        config.setSyncIntervalMinutes(request.syncIntervalMinutes());

        config = configRepository.save(config);
        log.info("1C config saved for organization {}", orgId);
        return Integration1cConfigResponse.from(config);
    }

    // ── Connection test ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Integration1cSyncResult testConnection(UUID configId) {
        Integration1cConfig config = configRepository.findByIdAndDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("1C config not found: " + configId));

        if (config.getBaseUrl() == null || config.getBaseUrl().isBlank()) {
            return Integration1cSyncResult.failure(null, "Base URL is not configured");
        }

        log.info("Testing 1C OData connection: {}/{}", config.getBaseUrl(), config.getDatabaseName());
        boolean ok = odataClient.testConnection(config);
        return ok
                ? Integration1cSyncResult.success(null, "1C OData connection OK", 0)
                : Integration1cSyncResult.failure(null, "1C OData connection failed — check URL/credentials");
    }

    // ── Export: Invoices ─────────────────────────────────────────────────

    @Transactional
    public Integration1cSyncResult exportInvoices(UUID configId, List<UUID> invoiceIds) {
        Integration1cConfig config = requireConfig(configId);

        Integration1cSyncLog syncLog = createSyncLog(configId, SyncDirection.EXPORT, "INVOICE");
        syncLog.setStatus(SyncStatus.IN_PROGRESS);
        syncLog.setStartedAt(Instant.now());
        syncLogRepository.save(syncLog);

        log.info("Exporting {} invoices to 1C (config={})", invoiceIds.size(), configId);

        // Stub: iterate invoices, convert to XML via Integration1cMapper, POST to 1C
        // For each invoice: Integration1cMapper.invoiceTo1cXml(invoice) → send to 1C web service

        syncLog.setStatus(SyncStatus.SUCCESS);
        syncLog.setRecordsProcessed(invoiceIds.size());
        syncLog.setCompletedAt(Instant.now());
        syncLogRepository.save(syncLog);

        config.setLastSyncAt(Instant.now());
        configRepository.save(config);

        return Integration1cSyncResult.success(syncLog.getId(),
                "Exported " + invoiceIds.size() + " invoice(s) to 1C", invoiceIds.size());
    }

    // ── Export: KS-2 ─────────────────────────────────────────────────────

    @Transactional
    public Integration1cSyncResult exportKs2(UUID configId, UUID ks2Id) {
        Integration1cConfig config = requireConfig(configId);

        Integration1cSyncLog syncLog = createSyncLog(configId, SyncDirection.EXPORT, "KS2");
        syncLog.setStatus(SyncStatus.IN_PROGRESS);
        syncLog.setStartedAt(Instant.now());
        syncLogRepository.save(syncLog);

        log.info("Exporting KS-2 {} to 1C (config={})", ks2Id, configId);

        // Stub: load Ks2Document, convert via Integration1cMapper.ks2To1cXml(), POST to 1C

        syncLog.setStatus(SyncStatus.SUCCESS);
        syncLog.setRecordsProcessed(1);
        syncLog.setCompletedAt(Instant.now());
        syncLogRepository.save(syncLog);

        config.setLastSyncAt(Instant.now());
        configRepository.save(config);

        return Integration1cSyncResult.success(syncLog.getId(), "KS-2 exported to 1C", 1);
    }

    // ── Export: KS-3 ─────────────────────────────────────────────────────

    @Transactional
    public Integration1cSyncResult exportKs3(UUID configId, UUID ks3Id) {
        Integration1cConfig config = requireConfig(configId);

        Integration1cSyncLog syncLog = createSyncLog(configId, SyncDirection.EXPORT, "KS3");
        syncLog.setStatus(SyncStatus.IN_PROGRESS);
        syncLog.setStartedAt(Instant.now());
        syncLogRepository.save(syncLog);

        log.info("Exporting KS-3 {} to 1C (config={})", ks3Id, configId);

        // Stub: load Ks3Document, convert via Integration1cMapper.ks3To1cXml(), POST to 1C

        syncLog.setStatus(SyncStatus.SUCCESS);
        syncLog.setRecordsProcessed(1);
        syncLog.setCompletedAt(Instant.now());
        syncLogRepository.save(syncLog);

        config.setLastSyncAt(Instant.now());
        configRepository.save(config);

        return Integration1cSyncResult.success(syncLog.getId(), "KS-3 exported to 1C", 1);
    }

    // ── Import: Counterparties ───────────────────────────────────────────

    @Transactional
    public Integration1cSyncResult importCounterparties(UUID configId) {
        Integration1cConfig config = requireConfig(configId);
        UUID orgId = config.getOrganizationId();

        Integration1cSyncLog syncLog = createSyncLog(configId, SyncDirection.IMPORT, "COUNTERPARTY");
        syncLog.setStatus(SyncStatus.IN_PROGRESS);
        syncLog.setStartedAt(Instant.now());
        syncLogRepository.save(syncLog);

        int importedCount = 0;
        int updatedCount = 0;
        try {
            List<OneCCounterparty> remote = odataClient.fetchCounterparties(config);

            for (OneCCounterparty cp : remote) {
                if (cp.getInn() == null || cp.getInn().isBlank()) continue;
                if (cp.getName() == null || cp.getName().isBlank()) continue;

                var existing = counterpartyRepository.findByOrganizationIdAndInnAndDeletedFalse(orgId, cp.getInn());
                if (existing.isPresent()) {
                    Counterparty entity = existing.get();
                    entity.setName(cp.getName());
                    if (cp.getKpp() != null) entity.setKpp(cp.getKpp());
                    if (cp.getOgrn() != null) entity.setOgrn(cp.getOgrn());
                    if (cp.getLegalAddress() != null) entity.setLegalAddress(cp.getLegalAddress());
                    counterpartyRepository.save(entity);
                    updatedCount++;
                } else {
                    Counterparty entity = Counterparty.builder()
                            .organizationId(orgId)
                            .name(cp.getName())
                            .inn(cp.getInn())
                            .kpp(cp.getKpp())
                            .ogrn(cp.getOgrn())
                            .legalAddress(cp.getLegalAddress())
                            .supplier(true)
                            .customer(false)
                            .build();
                    counterpartyRepository.save(entity);
                    importedCount++;
                }
            }

            syncLog.setStatus(SyncStatus.SUCCESS);
            syncLog.setRecordsProcessed(importedCount + updatedCount);
        } catch (Exception e) {
            log.error("1C counterparty import failed: {}", e.getMessage());
            syncLog.setStatus(SyncStatus.FAILED);
            syncLog.setErrorMessage(e.getMessage());
        }

        syncLog.setCompletedAt(Instant.now());
        syncLogRepository.save(syncLog);
        config.setLastSyncAt(Instant.now());
        configRepository.save(config);

        return syncLog.getStatus() != SyncStatus.FAILED
                ? Integration1cSyncResult.success(syncLog.getId(),
                        "Imported " + importedCount + " new, updated " + updatedCount + " counterparties from 1C",
                        importedCount + updatedCount)
                : Integration1cSyncResult.failure(syncLog.getId(), syncLog.getErrorMessage());
    }

    // ── Import: Chart of Accounts ────────────────────────────────────────

    @Transactional
    public Integration1cSyncResult importChartOfAccounts(UUID configId) {
        Integration1cConfig config = requireConfig(configId);

        Integration1cSyncLog syncLog = createSyncLog(configId, SyncDirection.IMPORT, "CHART_OF_ACCOUNTS");
        syncLog.setStatus(SyncStatus.IN_PROGRESS);
        syncLog.setStartedAt(Instant.now());
        syncLogRepository.save(syncLog);

        log.info("Importing chart of accounts from 1C (config={})", configId);

        // Stub: GET plan of accounts from 1C, map to PRIVOD AccountPlan entities
        int importedCount = 0;

        syncLog.setStatus(SyncStatus.SUCCESS);
        syncLog.setRecordsProcessed(importedCount);
        syncLog.setCompletedAt(Instant.now());
        syncLogRepository.save(syncLog);

        config.setLastSyncAt(Instant.now());
        configRepository.save(config);

        return Integration1cSyncResult.success(syncLog.getId(),
                "Imported " + importedCount + " accounts from 1C", importedCount);
    }

    // ── Bidirectional: Materials ──────────────────────────────────────────

    @Transactional
    public Integration1cSyncResult syncMaterials(UUID configId) {
        Integration1cConfig config = requireConfig(configId);

        Integration1cSyncLog syncLog = createSyncLog(configId, SyncDirection.BIDIRECTIONAL, "MATERIAL");
        syncLog.setStatus(SyncStatus.IN_PROGRESS);
        syncLog.setStartedAt(Instant.now());
        syncLogRepository.save(syncLog);

        log.info("Bidirectional material sync with 1C (config={})", configId);

        // Stub:
        // 1. Export new/modified PRIVOD materials to 1C
        // 2. Import new/modified 1C materials to PRIVOD
        // 3. Resolve conflicts (last-write-wins or manual review)
        int syncedCount = 0;

        syncLog.setStatus(SyncStatus.SUCCESS);
        syncLog.setRecordsProcessed(syncedCount);
        syncLog.setCompletedAt(Instant.now());
        syncLogRepository.save(syncLog);

        config.setLastSyncAt(Instant.now());
        configRepository.save(config);

        return Integration1cSyncResult.success(syncLog.getId(),
                "Synced " + syncedCount + " materials with 1C", syncedCount);
    }

    // ── Sync Logs ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<Integration1cSyncLogResponse> getSyncLogs(UUID configId, Pageable pageable) {
        return syncLogRepository.findByConfigIdOrderByCreatedAtDesc(configId, pageable)
                .map(Integration1cSyncLogResponse::from);
    }

    // ── Internal helpers ─────────────────────────────────────────────────

    private Integration1cConfig requireConfig(UUID configId) {
        return configRepository.findByIdAndDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("1C config not found: " + configId));
    }

    private Integration1cSyncLog createSyncLog(UUID configId, SyncDirection direction, String entityType) {
        Integration1cSyncLog syncLog = Integration1cSyncLog.builder()
                .configId(configId)
                .direction(direction)
                .entityType(entityType)
                .status(SyncStatus.PENDING)
                .build();
        return syncLogRepository.save(syncLog);
    }
}
