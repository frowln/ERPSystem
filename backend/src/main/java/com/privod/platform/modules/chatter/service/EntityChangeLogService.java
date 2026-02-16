package com.privod.platform.modules.chatter.service;

import com.privod.platform.modules.chatter.domain.EntityChangeLog;
import com.privod.platform.modules.chatter.repository.EntityChangeLogRepository;
import com.privod.platform.modules.chatter.web.dto.EntityChangeLogResponse;
import com.privod.platform.modules.chatter.web.dto.LogChangeRequest;
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
public class EntityChangeLogService {

    private final EntityChangeLogRepository changeLogRepository;

    @Transactional
    public EntityChangeLogResponse logChange(LogChangeRequest request) {
        EntityChangeLog changeLog = EntityChangeLog.builder()
                .entityType(request.entityType())
                .entityId(request.entityId())
                .fieldName(request.fieldName())
                .oldValue(request.oldValue())
                .newValue(request.newValue())
                .changedById(request.changedById())
                .changedAt(Instant.now())
                .build();

        changeLog = changeLogRepository.save(changeLog);
        log.debug("Change logged for {} {} field '{}': '{}' -> '{}'",
                request.entityType(), request.entityId(),
                request.fieldName(), request.oldValue(), request.newValue());
        return EntityChangeLogResponse.fromEntity(changeLog);
    }

    @Transactional
    public void logChange(String entityType, UUID entityId, String fieldName,
                          String oldValue, String newValue, UUID changedById) {
        EntityChangeLog changeLog = EntityChangeLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .fieldName(fieldName)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedById(changedById)
                .changedAt(Instant.now())
                .build();

        changeLogRepository.save(changeLog);
        log.debug("Change logged for {} {} field '{}'", entityType, entityId, fieldName);
    }

    @Transactional(readOnly = true)
    public Page<EntityChangeLogResponse> getChangeLogs(String entityType, UUID entityId,
                                                        String fieldName, Pageable pageable) {
        if (fieldName != null && !fieldName.isBlank()) {
            return changeLogRepository
                    .findByEntityTypeAndEntityIdAndFieldNameAndDeletedFalse(
                            entityType, entityId, fieldName, pageable)
                    .map(EntityChangeLogResponse::fromEntity);
        }
        return changeLogRepository
                .findByEntityTypeAndEntityIdAndDeletedFalse(entityType, entityId, pageable)
                .map(EntityChangeLogResponse::fromEntity);
    }
}
