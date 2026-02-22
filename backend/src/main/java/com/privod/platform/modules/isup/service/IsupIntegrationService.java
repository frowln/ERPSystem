package com.privod.platform.modules.isup.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.isup.domain.IsupConfiguration;
import com.privod.platform.modules.isup.domain.IsupProjectMapping;
import com.privod.platform.modules.isup.domain.IsupTransmission;
import com.privod.platform.modules.isup.domain.IsupTransmissionStatus;
import com.privod.platform.modules.isup.domain.IsupTransmissionType;
import com.privod.platform.modules.isup.domain.IsupVerificationRecord;
import com.privod.platform.modules.isup.domain.IsupVerificationType;
import com.privod.platform.modules.isup.repository.IsupConfigurationRepository;
import com.privod.platform.modules.isup.repository.IsupProjectMappingRepository;
import com.privod.platform.modules.isup.repository.IsupTransmissionRepository;
import com.privod.platform.modules.isup.repository.IsupVerificationRecordRepository;
import com.privod.platform.modules.isup.web.dto.CreateIsupConfigRequest;
import com.privod.platform.modules.isup.web.dto.CreateProjectMappingRequest;
import com.privod.platform.modules.isup.web.dto.IsupConfigurationResponse;
import com.privod.platform.modules.isup.web.dto.IsupDashboardResponse;
import com.privod.platform.modules.isup.web.dto.IsupProjectMappingResponse;
import com.privod.platform.modules.isup.web.dto.IsupTransmissionResponse;
import com.privod.platform.modules.isup.web.dto.IsupVerificationRecordResponse;
import com.privod.platform.modules.isup.web.dto.ReceiveVerificationRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IsupIntegrationService {

    private static final int MAX_RETRY_COUNT = 3;

    private final IsupConfigurationRepository configRepository;
    private final IsupProjectMappingRepository mappingRepository;
    private final IsupTransmissionRepository transmissionRepository;
    private final IsupVerificationRecordRepository verificationRepository;
    private final AuditService auditService;

    // ==================== Configuration CRUD ====================

    @Transactional(readOnly = true)
    public Page<IsupConfigurationResponse> listConfigs(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return configRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(IsupConfigurationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IsupConfigurationResponse getConfig(UUID id) {
        IsupConfiguration config = getConfigOrThrow(id);
        return IsupConfigurationResponse.fromEntity(config);
    }

    @Transactional
    public IsupConfigurationResponse createConfig(CreateIsupConfigRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        IsupConfiguration config = IsupConfiguration.builder()
                .organizationId(orgId)
                .apiUrl(request.apiUrl())
                .apiKeyEncrypted(request.apiKey())
                .certificatePath(request.certificatePath())
                .organizationInn(request.organizationInn())
                .organizationKpp(request.organizationKpp())
                .isActive(true)
                .build();

        config = configRepository.save(config);
        auditService.logCreate("IsupConfiguration", config.getId());

        log.info("Конфигурация ИСУП создана: ИНН {} ({})", config.getOrganizationInn(), config.getId());
        return IsupConfigurationResponse.fromEntity(config);
    }

    @Transactional
    public IsupConfigurationResponse updateConfig(UUID id, CreateIsupConfigRequest request) {
        IsupConfiguration config = getConfigOrThrow(id);

        config.setApiUrl(request.apiUrl());
        if (request.apiKey() != null && !request.apiKey().isBlank()) {
            config.setApiKeyEncrypted(request.apiKey());
        }
        config.setCertificatePath(request.certificatePath());
        config.setOrganizationInn(request.organizationInn());
        config.setOrganizationKpp(request.organizationKpp());

        config = configRepository.save(config);
        auditService.logUpdate("IsupConfiguration", config.getId(), "config", null, null);

        log.info("Конфигурация ИСУП обновлена: ИНН {} ({})", config.getOrganizationInn(), config.getId());
        return IsupConfigurationResponse.fromEntity(config);
    }

    @Transactional
    public void deleteConfig(UUID id) {
        IsupConfiguration config = getConfigOrThrow(id);
        config.softDelete();
        configRepository.save(config);
        auditService.logDelete("IsupConfiguration", id);
        log.info("Конфигурация ИСУП удалена: ({})", id);
    }

    @Transactional
    public IsupConfigurationResponse toggleConfig(UUID id) {
        IsupConfiguration config = getConfigOrThrow(id);
        boolean oldActive = config.isActive();
        config.setActive(!oldActive);
        config = configRepository.save(config);
        auditService.logUpdate("IsupConfiguration", id, "isActive",
                String.valueOf(oldActive), String.valueOf(config.isActive()));

        log.info("Конфигурация ИСУП {}: ({})",
                config.isActive() ? "активирована" : "деактивирована", id);
        return IsupConfigurationResponse.fromEntity(config);
    }

    // ==================== Project Mapping CRUD ====================

    @Transactional(readOnly = true)
    public Page<IsupProjectMappingResponse> listMappings(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return mappingRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(IsupProjectMappingResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IsupProjectMappingResponse getMapping(UUID id) {
        IsupProjectMapping mapping = getMappingOrThrow(id);
        return IsupProjectMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public IsupProjectMappingResponse createMapping(CreateProjectMappingRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        mappingRepository.findByPrivodProjectIdAndDeletedFalse(request.privodProjectId())
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            "Маппинг ИСУП для проекта " + request.privodProjectId() + " уже существует");
                });

        IsupProjectMapping mapping = IsupProjectMapping.builder()
                .organizationId(orgId)
                .privodProjectId(request.privodProjectId())
                .isupProjectId(request.isupProjectId())
                .isupObjectId(request.isupObjectId())
                .governmentContractNumber(request.governmentContractNumber())
                .registrationNumber(request.registrationNumber())
                .syncEnabled(true)
                .build();

        mapping = mappingRepository.save(mapping);
        auditService.logCreate("IsupProjectMapping", mapping.getId());

        log.info("Маппинг ИСУП создан: проект {} -> ИСУП {} ({})",
                mapping.getPrivodProjectId(), mapping.getIsupProjectId(), mapping.getId());
        return IsupProjectMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public IsupProjectMappingResponse updateMapping(UUID id, CreateProjectMappingRequest request) {
        IsupProjectMapping mapping = getMappingOrThrow(id);

        mapping.setPrivodProjectId(request.privodProjectId());
        mapping.setIsupProjectId(request.isupProjectId());
        mapping.setIsupObjectId(request.isupObjectId());
        mapping.setGovernmentContractNumber(request.governmentContractNumber());
        mapping.setRegistrationNumber(request.registrationNumber());

        mapping = mappingRepository.save(mapping);
        auditService.logUpdate("IsupProjectMapping", mapping.getId(), "mapping", null, null);

        log.info("Маппинг ИСУП обновлён: проект {} -> ИСУП {} ({})",
                mapping.getPrivodProjectId(), mapping.getIsupProjectId(), mapping.getId());
        return IsupProjectMappingResponse.fromEntity(mapping);
    }

    @Transactional
    public void deleteMapping(UUID id) {
        IsupProjectMapping mapping = getMappingOrThrow(id);
        mapping.softDelete();
        mappingRepository.save(mapping);
        auditService.logDelete("IsupProjectMapping", id);
        log.info("Маппинг ИСУП удалён: ({})", id);
    }

    @Transactional
    public IsupProjectMappingResponse toggleMappingSync(UUID id) {
        IsupProjectMapping mapping = getMappingOrThrow(id);
        boolean oldSync = mapping.isSyncEnabled();
        mapping.setSyncEnabled(!oldSync);
        mapping = mappingRepository.save(mapping);
        auditService.logUpdate("IsupProjectMapping", id, "syncEnabled",
                String.valueOf(oldSync), String.valueOf(mapping.isSyncEnabled()));

        log.info("Синхронизация маппинга ИСУП {}: ({})",
                mapping.isSyncEnabled() ? "включена" : "выключена", id);
        return IsupProjectMappingResponse.fromEntity(mapping);
    }

    // ==================== Transmission Operations ====================

    @Transactional
    public IsupTransmissionResponse transmitProgress(UUID projectMappingId) {
        IsupProjectMapping mapping = getMappingOrThrow(projectMappingId);

        String payload = buildProgressPayload(mapping);

        IsupTransmission transmission = createTransmission(
                mapping, IsupTransmissionType.PROGRESS, payload);

        log.info("Передача хода строительства создана: маппинг {} ({})",
                projectMappingId, transmission.getId());
        return IsupTransmissionResponse.fromEntity(transmission);
    }

    @Transactional
    public IsupTransmissionResponse transmitDocuments(UUID projectMappingId, List<UUID> documentIds) {
        IsupProjectMapping mapping = getMappingOrThrow(projectMappingId);

        String payload = buildDocumentsPayload(mapping, documentIds);

        IsupTransmission transmission = createTransmission(
                mapping, IsupTransmissionType.DOCUMENTS, payload);

        log.info("Передача документации создана: маппинг {}, документов: {} ({})",
                projectMappingId, documentIds != null ? documentIds.size() : 0, transmission.getId());
        return IsupTransmissionResponse.fromEntity(transmission);
    }

    @Transactional
    public IsupTransmissionResponse transmitPhotos(UUID projectMappingId) {
        IsupProjectMapping mapping = getMappingOrThrow(projectMappingId);

        String payload = buildPhotosPayload(mapping);

        IsupTransmission transmission = createTransmission(
                mapping, IsupTransmissionType.PHOTOS, payload);

        log.info("Передача фотоматериалов создана: маппинг {} ({})",
                projectMappingId, transmission.getId());
        return IsupTransmissionResponse.fromEntity(transmission);
    }

    @Transactional
    public IsupTransmissionResponse processTransmission(UUID transmissionId) {
        IsupTransmission transmission = getTransmissionOrThrow(transmissionId);

        IsupTransmissionStatus oldStatus = transmission.getStatus();
        transmission.setStatus(IsupTransmissionStatus.SENDING);
        transmission = transmissionRepository.save(transmission);

        // Simulate sending to ISUP - in production this would make an actual API call
        transmission.setStatus(IsupTransmissionStatus.SENT);
        transmission.setSentAt(Instant.now());
        transmission.setExternalId(UUID.randomUUID().toString());
        transmission = transmissionRepository.save(transmission);

        auditService.logStatusChange("IsupTransmission", transmissionId,
                oldStatus.name(), IsupTransmissionStatus.SENT.name());

        // Update config last sync time
        updateLastSyncTime(transmission.getOrganizationId());

        log.info("Передача ИСУП отправлена: {} -> SENT ({})", oldStatus, transmissionId);
        return IsupTransmissionResponse.fromEntity(transmission);
    }

    @Transactional
    public IsupVerificationRecordResponse receiveVerification(ReceiveVerificationRequest request) {
        IsupTransmission transmission = getTransmissionOrThrow(request.transmissionId());

        // Update transmission status based on verification type
        IsupTransmissionStatus oldStatus = transmission.getStatus();
        IsupTransmissionStatus newStatus = switch (request.verificationType()) {
            case APPROVED -> IsupTransmissionStatus.CONFIRMED;
            case REJECTED -> IsupTransmissionStatus.REJECTED;
            case NEEDS_REVISION -> IsupTransmissionStatus.REJECTED;
            case PENDING -> transmission.getStatus();
        };

        if (newStatus == IsupTransmissionStatus.CONFIRMED) {
            transmission.setConfirmedAt(Instant.now());
        }
        transmission.setStatus(newStatus);
        transmissionRepository.save(transmission);

        auditService.logStatusChange("IsupTransmission", transmission.getId(),
                oldStatus.name(), newStatus.name());

        // Create verification record
        IsupVerificationRecord record = IsupVerificationRecord.builder()
                .organizationId(transmission.getOrganizationId())
                .transmissionId(request.transmissionId())
                .verificationType(request.verificationType())
                .verifiedByName(request.verifiedByName())
                .verifiedAt(Instant.now())
                .comments(request.comments())
                .externalReference(request.externalReference())
                .build();

        record = verificationRepository.save(record);
        auditService.logCreate("IsupVerificationRecord", record.getId());

        log.info("Верификация ИСУП получена: передача {} — {} ({})",
                request.transmissionId(), request.verificationType(), record.getId());
        return IsupVerificationRecordResponse.fromEntity(record);
    }

    @Transactional
    public IsupTransmissionResponse retryTransmission(UUID transmissionId) {
        IsupTransmission transmission = getTransmissionOrThrow(transmissionId);

        if (transmission.getStatus() != IsupTransmissionStatus.ERROR
                && transmission.getStatus() != IsupTransmissionStatus.REJECTED) {
            throw new IllegalStateException(
                    "Повторная отправка возможна только для передач со статусом ОШИБКА или ОТКЛОНЕНО");
        }

        if (transmission.getRetryCount() >= MAX_RETRY_COUNT) {
            throw new IllegalStateException(
                    "Превышено максимальное количество повторных попыток (" + MAX_RETRY_COUNT + ")");
        }

        transmission.setRetryCount(transmission.getRetryCount() + 1);
        transmission.setStatus(IsupTransmissionStatus.PENDING);
        transmission.setErrorMessage(null);
        transmission = transmissionRepository.save(transmission);

        auditService.logUpdate("IsupTransmission", transmissionId, "retryCount",
                null, String.valueOf(transmission.getRetryCount()));

        log.info("Передача ИСУП поставлена на повтор: попытка {} ({})",
                transmission.getRetryCount(), transmissionId);
        return IsupTransmissionResponse.fromEntity(transmission);
    }

    // ==================== Transmission Queries ====================

    @Transactional(readOnly = true)
    public Page<IsupTransmissionResponse> listTransmissions(
            IsupTransmissionStatus status, IsupTransmissionType type,
            UUID projectMappingId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        if (status != null) {
            return transmissionRepository
                    .findByOrganizationIdAndStatusAndDeletedFalse(orgId, status, pageable)
                    .map(IsupTransmissionResponse::fromEntity);
        }
        if (type != null) {
            return transmissionRepository
                    .findByOrganizationIdAndTransmissionTypeAndDeletedFalse(orgId, type, pageable)
                    .map(IsupTransmissionResponse::fromEntity);
        }
        if (projectMappingId != null) {
            return transmissionRepository
                    .findByOrganizationIdAndProjectMappingIdAndDeletedFalse(orgId, projectMappingId, pageable)
                    .map(IsupTransmissionResponse::fromEntity);
        }
        return transmissionRepository
                .findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(IsupTransmissionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IsupTransmissionResponse getTransmission(UUID id) {
        IsupTransmission transmission = getTransmissionOrThrow(id);
        return IsupTransmissionResponse.fromEntity(transmission);
    }

    // ==================== Verification Queries ====================

    @Transactional(readOnly = true)
    public Page<IsupVerificationRecordResponse> listVerifications(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return verificationRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(IsupVerificationRecordResponse::fromEntity);
    }

    // ==================== Dashboard ====================

    @Transactional(readOnly = true)
    public IsupDashboardResponse getDashboard() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        long totalMappings = mappingRepository.countByOrganizationIdAndDeletedFalse(orgId);
        long activeMappings = mappingRepository.countByOrganizationIdAndSyncEnabledAndDeletedFalse(orgId, true);
        long pendingTransmissions = transmissionRepository.countByOrganizationIdAndStatusAndDeletedFalse(
                orgId, IsupTransmissionStatus.PENDING);

        YearMonth currentMonth = YearMonth.now();
        Instant monthStart = currentMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        long confirmedThisMonth = transmissionRepository
                .countByOrganizationIdAndStatusAndConfirmedAtAfterAndDeletedFalse(
                        orgId, IsupTransmissionStatus.CONFIRMED, monthStart);
        long rejectedThisMonth = transmissionRepository
                .countByOrganizationIdAndStatusAndConfirmedAtAfterAndDeletedFalse(
                        orgId, IsupTransmissionStatus.REJECTED, monthStart);

        Instant lastSyncAt = configRepository
                .findByOrganizationIdAndIsActiveAndDeletedFalse(orgId, true)
                .map(IsupConfiguration::getLastSyncAt)
                .orElse(null);

        return new IsupDashboardResponse(
                totalMappings,
                activeMappings,
                pendingTransmissions,
                confirmedThisMonth,
                rejectedThisMonth,
                lastSyncAt
        );
    }

    // ==================== Scheduled Retry ====================

    @Scheduled(fixedDelayString = "${app.isup.retry-interval-ms:600000}")
    @Transactional
    public void retryFailedTransmissions() {
        List<IsupTransmission> failed = transmissionRepository
                .findByStatusAndRetryCountLessThanAndDeletedFalse(
                        IsupTransmissionStatus.ERROR, MAX_RETRY_COUNT);

        if (failed.isEmpty()) {
            return;
        }

        log.info("Повторная отправка ИСУП: найдено {} передач с ошибками", failed.size());

        for (IsupTransmission transmission : failed) {
            try {
                transmission.setRetryCount(transmission.getRetryCount() + 1);
                transmission.setStatus(IsupTransmissionStatus.SENDING);
                transmission.setErrorMessage(null);
                transmissionRepository.save(transmission);

                // Simulate sending - in production would call ISUP API
                transmission.setStatus(IsupTransmissionStatus.SENT);
                transmission.setSentAt(Instant.now());
                transmission.setExternalId(UUID.randomUUID().toString());
                transmissionRepository.save(transmission);

                auditService.logStatusChange("IsupTransmission", transmission.getId(),
                        IsupTransmissionStatus.ERROR.name(), IsupTransmissionStatus.SENT.name());

                log.info("Повторная отправка ИСУП успешна: попытка {} ({})",
                        transmission.getRetryCount(), transmission.getId());
            } catch (Exception e) {
                transmission.setStatus(IsupTransmissionStatus.ERROR);
                transmission.setErrorMessage("Ошибка повторной отправки: " + e.getMessage());
                transmissionRepository.save(transmission);

                log.error("Ошибка повторной отправки ИСУП: попытка {} ({}): {}",
                        transmission.getRetryCount(), transmission.getId(), e.getMessage());
            }
        }
    }

    // ==================== Private Helpers ====================

    private IsupTransmission createTransmission(IsupProjectMapping mapping,
                                                  IsupTransmissionType type, String payload) {
        IsupTransmission transmission = IsupTransmission.builder()
                .organizationId(mapping.getOrganizationId())
                .projectMappingId(mapping.getId())
                .transmissionType(type)
                .payloadJson(payload)
                .status(IsupTransmissionStatus.PENDING)
                .retryCount(0)
                .build();

        transmission = transmissionRepository.save(transmission);
        auditService.logCreate("IsupTransmission", transmission.getId());
        return transmission;
    }

    private String buildProgressPayload(IsupProjectMapping mapping) {
        return "{\"type\":\"PROGRESS\",\"projectId\":\"" + mapping.getIsupProjectId()
                + "\",\"objectId\":\"" + mapping.getIsupObjectId()
                + "\",\"contractNumber\":\"" + mapping.getGovernmentContractNumber()
                + "\",\"timestamp\":\"" + Instant.now() + "\"}";
    }

    private String buildDocumentsPayload(IsupProjectMapping mapping, List<UUID> documentIds) {
        String docIds = documentIds != null
                ? documentIds.stream().map(UUID::toString).reduce((a, b) -> a + "\",\"" + b).orElse("")
                : "";
        return "{\"type\":\"DOCUMENTS\",\"projectId\":\"" + mapping.getIsupProjectId()
                + "\",\"documentIds\":[\"" + docIds
                + "\"],\"timestamp\":\"" + Instant.now() + "\"}";
    }

    private String buildPhotosPayload(IsupProjectMapping mapping) {
        return "{\"type\":\"PHOTOS\",\"projectId\":\"" + mapping.getIsupProjectId()
                + "\",\"objectId\":\"" + mapping.getIsupObjectId()
                + "\",\"timestamp\":\"" + Instant.now() + "\"}";
    }

    private void updateLastSyncTime(UUID organizationId) {
        configRepository.findByOrganizationIdAndIsActiveAndDeletedFalse(organizationId, true)
                .ifPresent(config -> {
                    config.setLastSyncAt(Instant.now());
                    configRepository.save(config);
                });
    }

    private IsupConfiguration getConfigOrThrow(UUID id) {
        return configRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Конфигурация ИСУП не найдена: " + id));
    }

    private IsupProjectMapping getMappingOrThrow(UUID id) {
        return mappingRepository.findById(id)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Маппинг ИСУП не найден: " + id));
    }

    private IsupTransmission getTransmissionOrThrow(UUID id) {
        return transmissionRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Передача ИСУП не найдена: " + id));
    }
}
