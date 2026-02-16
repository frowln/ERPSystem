package com.privod.platform.modules.integration.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.SyncJob;
import com.privod.platform.modules.integration.domain.SyncJobStatus;
import com.privod.platform.modules.integration.repository.SyncJobRepository;
import com.privod.platform.modules.integration.web.dto.StartSyncRequest;
import com.privod.platform.modules.integration.web.dto.SyncJobResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {

    private final SyncJobRepository syncJobRepository;
    private final IntegrationEndpointService endpointService;
    private final AuditService auditService;

    @Transactional
    public SyncJobResponse startSync(StartSyncRequest request) {
        // Validate that the endpoint exists
        endpointService.getEndpointOrThrow(request.endpointId());

        String code = generateSyncCode();

        SyncJob syncJob = SyncJob.builder()
                .code(code)
                .endpointId(request.endpointId())
                .syncType(request.syncType())
                .direction(request.direction())
                .entityType(request.entityType())
                .status(SyncJobStatus.PENDING)
                .build();

        syncJob = syncJobRepository.save(syncJob);
        auditService.logCreate("SyncJob", syncJob.getId());

        // Transition to RUNNING
        syncJob.setStatus(SyncJobStatus.RUNNING);
        syncJob.setStartedAt(Instant.now());
        syncJob = syncJobRepository.save(syncJob);

        log.info("Синхронизация запущена: {} для {} ({})",
                syncJob.getCode(), syncJob.getEntityType(), syncJob.getId());
        return SyncJobResponse.fromEntity(syncJob);
    }

    @Transactional
    public SyncJobResponse cancelSync(UUID id) {
        SyncJob syncJob = getSyncJobOrThrow(id);
        SyncJobStatus oldStatus = syncJob.getStatus();

        if (!syncJob.canTransitionTo(SyncJobStatus.CANCELLED)) {
            throw new IllegalStateException(
                    String.format("Невозможно отменить синхронизацию в статусе %s", oldStatus.getDisplayName()));
        }

        syncJob.setStatus(SyncJobStatus.CANCELLED);
        syncJob.setCompletedAt(Instant.now());
        syncJob = syncJobRepository.save(syncJob);

        auditService.logStatusChange("SyncJob", syncJob.getId(), oldStatus.name(), SyncJobStatus.CANCELLED.name());

        log.info("Синхронизация отменена: {} ({})", syncJob.getCode(), syncJob.getId());
        return SyncJobResponse.fromEntity(syncJob);
    }

    @Transactional(readOnly = true)
    public Page<SyncJobResponse> getSyncHistory(UUID endpointId, Pageable pageable) {
        if (endpointId != null) {
            return syncJobRepository.findByEndpointIdAndDeletedFalse(endpointId, pageable)
                    .map(SyncJobResponse::fromEntity);
        }
        return syncJobRepository.findByDeletedFalse(pageable)
                .map(SyncJobResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SyncJobResponse getLastSync(UUID endpointId, String entityType) {
        SyncJob syncJob = syncJobRepository.findLastSync(endpointId, entityType)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Синхронизация не найдена для endpoint: " + endpointId + ", entityType: " + entityType));
        return SyncJobResponse.fromEntity(syncJob);
    }

    @Transactional(readOnly = true)
    public SyncJobResponse findById(UUID id) {
        SyncJob syncJob = getSyncJobOrThrow(id);
        return SyncJobResponse.fromEntity(syncJob);
    }

    @Transactional
    public SyncJobResponse retryFailed(UUID id) {
        SyncJob syncJob = getSyncJobOrThrow(id);

        if (syncJob.getStatus() != SyncJobStatus.FAILED) {
            throw new IllegalStateException(
                    "Повторная синхронизация возможна только для заданий со статусом 'Ошибка'");
        }

        syncJob.setStatus(SyncJobStatus.PENDING);
        syncJob.setErrorCount(0);
        syncJob.setErrorLog(null);
        syncJob.setProcessedCount(0);
        syncJob.setStartedAt(null);
        syncJob.setCompletedAt(null);
        syncJob = syncJobRepository.save(syncJob);

        // Transition to RUNNING
        syncJob.setStatus(SyncJobStatus.RUNNING);
        syncJob.setStartedAt(Instant.now());
        syncJob = syncJobRepository.save(syncJob);

        auditService.logStatusChange("SyncJob", syncJob.getId(), SyncJobStatus.FAILED.name(), SyncJobStatus.RUNNING.name());

        log.info("Повторная синхронизация запущена: {} ({})", syncJob.getCode(), syncJob.getId());
        return SyncJobResponse.fromEntity(syncJob);
    }

    @Transactional
    public SyncJobResponse completeSync(UUID id, int processedCount, int errorCount, String errorLog) {
        SyncJob syncJob = getSyncJobOrThrow(id);

        syncJob.setProcessedCount(processedCount);
        syncJob.setErrorCount(errorCount);
        syncJob.setErrorLog(errorLog);
        syncJob.setCompletedAt(Instant.now());
        syncJob.setStatus(errorCount > 0 && processedCount == 0 ? SyncJobStatus.FAILED : SyncJobStatus.COMPLETED);

        syncJob = syncJobRepository.save(syncJob);

        log.info("Синхронизация завершена: {} обработано: {}, ошибок: {} ({})",
                syncJob.getCode(), processedCount, errorCount, syncJob.getId());
        return SyncJobResponse.fromEntity(syncJob);
    }

    private SyncJob getSyncJobOrThrow(UUID id) {
        return syncJobRepository.findById(id)
                .filter(j -> !j.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Задание синхронизации не найдено: " + id));
    }

    private String generateSyncCode() {
        long seq = syncJobRepository.getNextCodeSequence();
        return String.format("SYNC-%05d", seq);
    }
}
