package com.privod.platform.modules.notification.service;

import com.privod.platform.modules.notification.domain.BatchStatus;
import com.privod.platform.modules.notification.domain.NotificationBatch;
import com.privod.platform.modules.notification.repository.NotificationBatchRepository;
import com.privod.platform.modules.notification.web.dto.CreateBatchRequest;
import com.privod.platform.modules.notification.web.dto.NotificationBatchResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationBatchService {

    private final NotificationBatchRepository batchRepository;

    @Transactional(readOnly = true)
    public Page<NotificationBatchResponse> listBatches(Pageable pageable) {
        return batchRepository.findByDeletedFalse(pageable)
                .map(NotificationBatchResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public NotificationBatchResponse getBatch(UUID id) {
        NotificationBatch batch = getBatchOrThrow(id);
        return NotificationBatchResponse.fromEntity(batch);
    }

    @Transactional
    public NotificationBatchResponse createBatch(CreateBatchRequest request) {
        NotificationBatch batch = NotificationBatch.builder()
                .title(request.title())
                .message(request.message())
                .notificationType(request.notificationType())
                .targetType(request.targetType())
                .targetFilter(request.targetFilter() != null ? request.targetFilter() : new HashMap<>())
                .createdById(request.createdById())
                .status(BatchStatus.PENDING)
                .sentCount(0)
                .build();

        batch = batchRepository.save(batch);
        log.info("Notification batch created: {} - {} ({})", batch.getTitle(), batch.getTargetType(), batch.getId());
        return NotificationBatchResponse.fromEntity(batch);
    }

    @Transactional
    public NotificationBatchResponse sendBatch(UUID id) {
        NotificationBatch batch = getBatchOrThrow(id);

        if (batch.getStatus() != BatchStatus.PENDING) {
            throw new IllegalStateException(
                    String.format("Невозможно отправить пакет уведомлений из статуса '%s'",
                            batch.getStatus().getDisplayName()));
        }

        batch.setStatus(BatchStatus.SENDING);
        batch = batchRepository.save(batch);

        // In a real implementation, this would be async and process the target users
        // For now, mark as sent
        try {
            int sentCount = processBatchSending(batch);
            batch.setSentCount(sentCount);
            batch.setStatus(BatchStatus.SENT);
            log.info("Notification batch sent: {} - {} notifications ({})",
                    batch.getTitle(), sentCount, batch.getId());
        } catch (Exception e) {
            batch.setStatus(BatchStatus.FAILED);
            log.error("Notification batch failed: {} ({})", batch.getTitle(), batch.getId(), e);
        }

        batch = batchRepository.save(batch);
        return NotificationBatchResponse.fromEntity(batch);
    }

    @Transactional
    public NotificationBatchResponse updateBatch(UUID id, CreateBatchRequest request) {
        NotificationBatch batch = getBatchOrThrow(id);

        if (batch.getStatus() != BatchStatus.PENDING) {
            throw new IllegalStateException("Нельзя редактировать отправленный или отправляемый пакет");
        }

        if (request.title() != null) batch.setTitle(request.title());
        if (request.message() != null) batch.setMessage(request.message());
        if (request.notificationType() != null) batch.setNotificationType(request.notificationType());
        if (request.targetType() != null) batch.setTargetType(request.targetType());
        if (request.targetFilter() != null) batch.setTargetFilter(request.targetFilter());

        batch = batchRepository.save(batch);
        log.info("Notification batch updated: {} ({})", batch.getTitle(), batch.getId());
        return NotificationBatchResponse.fromEntity(batch);
    }

    @Transactional
    public void deleteBatch(UUID id) {
        NotificationBatch batch = getBatchOrThrow(id);
        batch.softDelete();
        batchRepository.save(batch);
        log.info("Notification batch deleted: {} ({})", batch.getTitle(), id);
    }

    @Transactional(readOnly = true)
    public NotificationBatchResponse getStatus(UUID id) {
        NotificationBatch batch = getBatchOrThrow(id);
        return NotificationBatchResponse.fromEntity(batch);
    }

    private int processBatchSending(NotificationBatch batch) {
        // Placeholder for actual batch sending logic
        // In production, this would:
        // 1. Query users based on targetType and targetFilter
        // 2. Create individual notifications for each user
        // 3. Return the count of successfully sent notifications
        log.info("Processing batch send for target type: {} with filter: {}",
                batch.getTargetType(), batch.getTargetFilter());
        return 0;
    }

    private NotificationBatch getBatchOrThrow(UUID id) {
        return batchRepository.findById(id)
                .filter(b -> !b.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пакет уведомлений не найден: " + id));
    }
}
