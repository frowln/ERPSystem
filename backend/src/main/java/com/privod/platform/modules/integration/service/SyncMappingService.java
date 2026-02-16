package com.privod.platform.modules.integration.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.MappingDirection;
import com.privod.platform.modules.integration.domain.SyncMapping;
import com.privod.platform.modules.integration.repository.SyncMappingRepository;
import com.privod.platform.modules.integration.web.dto.CreateSyncMappingRequest;
import com.privod.platform.modules.integration.web.dto.SyncMappingResponse;
import com.privod.platform.modules.integration.web.dto.UpdateSyncMappingRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SyncMappingService {

    private final SyncMappingRepository syncMappingRepository;
    private final IntegrationEndpointService endpointService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SyncMappingResponse> findAll(UUID endpointId, Pageable pageable) {
        if (endpointId != null) {
            return syncMappingRepository.findByEndpointIdAndDeletedFalse(endpointId, pageable)
                    .map(SyncMappingResponse::fromEntity);
        }
        return syncMappingRepository.findByDeletedFalse(pageable)
                .map(SyncMappingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SyncMappingResponse findById(UUID id) {
        SyncMapping mapping = getMappingOrThrow(id);
        return SyncMappingResponse.fromEntity(mapping);
    }

    @Transactional(readOnly = true)
    public List<SyncMappingResponse> getFieldMapping(UUID endpointId, String localEntityType) {
        return syncMappingRepository.findByEndpointIdAndLocalEntityTypeAndDeletedFalse(endpointId, localEntityType)
                .stream()
                .map(SyncMappingResponse::fromEntity)
                .toList();
    }

    @Transactional
    public SyncMappingResponse create(CreateSyncMappingRequest request) {
        // Validate endpoint exists
        endpointService.getEndpointOrThrow(request.endpointId());

        SyncMapping mapping = SyncMapping.builder()
                .endpointId(request.endpointId())
                .localEntityType(request.localEntityType())
                .localFieldName(request.localFieldName())
                .remoteEntityType(request.remoteEntityType())
                .remoteFieldName(request.remoteFieldName())
                .transformExpression(request.transformExpression())
                .direction(request.direction() != null ? request.direction() : MappingDirection.BOTH)
                .isRequired(request.isRequired() != null ? request.isRequired() : false)
                .build();

        mapping = syncMappingRepository.save(mapping);
        auditService.logCreate("SyncMapping", mapping.getId());

        log.info("Маппинг синхронизации создан: {}.{} <-> {}.{} ({})",
                mapping.getLocalEntityType(), mapping.getLocalFieldName(),
                mapping.getRemoteEntityType(), mapping.getRemoteFieldName(),
                mapping.getId());
        return SyncMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public SyncMappingResponse update(UUID id, UpdateSyncMappingRequest request) {
        SyncMapping mapping = getMappingOrThrow(id);

        if (request.localFieldName() != null) {
            mapping.setLocalFieldName(request.localFieldName());
        }
        if (request.remoteFieldName() != null) {
            mapping.setRemoteFieldName(request.remoteFieldName());
        }
        if (request.transformExpression() != null) {
            mapping.setTransformExpression(request.transformExpression());
        }
        if (request.direction() != null) {
            mapping.setDirection(request.direction());
        }
        if (request.isRequired() != null) {
            mapping.setRequired(request.isRequired());
        }

        mapping = syncMappingRepository.save(mapping);
        auditService.logUpdate("SyncMapping", mapping.getId(), "multiple", null, null);

        log.info("Маппинг синхронизации обновлён: ({})", mapping.getId());
        return SyncMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public void delete(UUID id) {
        SyncMapping mapping = getMappingOrThrow(id);
        mapping.softDelete();
        syncMappingRepository.save(mapping);
        auditService.logDelete("SyncMapping", id);
        log.info("Маппинг синхронизации удалён: ({})", id);
    }

    public String applyTransformation(String value, String transformExpression) {
        if (transformExpression == null || transformExpression.isBlank()) {
            return value;
        }
        if (value == null) {
            return null;
        }

        try {
            if (transformExpression.equals("toUpperCase()")) {
                return value.toUpperCase();
            } else if (transformExpression.equals("toLowerCase()")) {
                return value.toLowerCase();
            } else if (transformExpression.equals("trim()")) {
                return value.trim();
            } else if (transformExpression.startsWith("value * ")) {
                double multiplier = Double.parseDouble(transformExpression.substring(8));
                double result = Double.parseDouble(value) * multiplier;
                return String.valueOf(result);
            } else if (transformExpression.startsWith("value / ")) {
                double divisor = Double.parseDouble(transformExpression.substring(8));
                double result = Double.parseDouble(value) / divisor;
                return String.valueOf(result);
            } else if (transformExpression.startsWith("prefix:")) {
                String prefix = transformExpression.substring(7);
                return prefix + value;
            } else if (transformExpression.startsWith("suffix:")) {
                String suffix = transformExpression.substring(7);
                return value + suffix;
            }
            log.warn("Неизвестное выражение трансформации: {}", transformExpression);
            return value;
        } catch (Exception e) {
            log.error("Ошибка применения трансформации '{}' к значению '{}': {}",
                    transformExpression, value, e.getMessage());
            return value;
        }
    }

    private SyncMapping getMappingOrThrow(UUID id) {
        return syncMappingRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Маппинг синхронизации не найден: " + id));
    }
}
