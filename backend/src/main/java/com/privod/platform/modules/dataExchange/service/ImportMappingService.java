package com.privod.platform.modules.dataExchange.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.dataExchange.domain.ImportMapping;
import com.privod.platform.modules.dataExchange.repository.ImportMappingRepository;
import com.privod.platform.modules.dataExchange.web.dto.CreateImportMappingRequest;
import com.privod.platform.modules.dataExchange.web.dto.ImportMappingResponse;
import com.privod.platform.modules.dataExchange.web.dto.UpdateImportMappingRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportMappingService {

    private final ImportMappingRepository mappingRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ImportMappingResponse> findAll(String entityType, Pageable pageable) {
        if (entityType != null && !entityType.isBlank()) {
            return mappingRepository.findByEntityTypeAndDeletedFalse(entityType, pageable)
                    .map(ImportMappingResponse::fromEntity);
        }
        return mappingRepository.findByDeletedFalse(pageable).map(ImportMappingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ImportMappingResponse findById(UUID id) {
        ImportMapping mapping = getOrThrow(id);
        return ImportMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public ImportMappingResponse create(CreateImportMappingRequest request) {
        ImportMapping mapping = ImportMapping.builder()
                .name(request.name())
                .entityType(request.entityType())
                .mappingConfig(request.mappingConfig())
                .isDefault(request.isDefault() != null ? request.isDefault() : false)
                .createdById(request.createdById())
                .build();

        mapping = mappingRepository.save(mapping);
        auditService.logCreate("ImportMapping", mapping.getId());

        log.info("Маппинг импорта создан: {} для {} ({})", mapping.getName(), mapping.getEntityType(), mapping.getId());
        return ImportMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public ImportMappingResponse update(UUID id, UpdateImportMappingRequest request) {
        ImportMapping mapping = getOrThrow(id);

        if (request.name() != null) {
            mapping.setName(request.name());
        }
        if (request.entityType() != null) {
            mapping.setEntityType(request.entityType());
        }
        if (request.mappingConfig() != null) {
            mapping.setMappingConfig(request.mappingConfig());
        }
        if (request.isDefault() != null) {
            mapping.setIsDefault(request.isDefault());
        }

        mapping = mappingRepository.save(mapping);
        auditService.logUpdate("ImportMapping", id, "multiple", null, null);

        log.info("Маппинг импорта обновлён: {} ({})", mapping.getName(), mapping.getId());
        return ImportMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public void delete(UUID id) {
        ImportMapping mapping = getOrThrow(id);
        mapping.softDelete();
        mappingRepository.save(mapping);
        auditService.logDelete("ImportMapping", id);
        log.info("Маппинг импорта удалён: {} ({})", mapping.getName(), id);
    }

    private ImportMapping getOrThrow(UUID id) {
        return mappingRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Маппинг импорта не найден: " + id));
    }
}
