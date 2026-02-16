package com.privod.platform.modules.settings.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.settings.domain.AuditSetting;
import com.privod.platform.modules.settings.repository.AuditSettingRepository;
import com.privod.platform.modules.settings.web.dto.AuditSettingResponse;
import com.privod.platform.modules.settings.web.dto.CreateAuditSettingRequest;
import com.privod.platform.modules.settings.web.dto.UpdateAuditSettingRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditSettingService {

    private final AuditSettingRepository auditSettingRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<AuditSettingResponse> listAll() {
        return auditSettingRepository.findByDeletedFalseOrderByModelNameAsc()
                .stream()
                .map(AuditSettingResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuditSettingResponse getByModelName(String modelName) {
        AuditSetting setting = auditSettingRepository.findByModelNameAndDeletedFalse(modelName)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Настройка аудита не найдена для модели: " + modelName));
        return AuditSettingResponse.fromEntity(setting);
    }

    @Transactional(readOnly = true)
    public AuditSettingResponse getById(UUID id) {
        AuditSetting setting = auditSettingRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Настройка аудита не найдена: " + id));
        return AuditSettingResponse.fromEntity(setting);
    }

    @Transactional
    public AuditSettingResponse createSetting(CreateAuditSettingRequest request) {
        if (auditSettingRepository.existsByModelNameAndDeletedFalse(request.modelName())) {
            throw new IllegalArgumentException(
                    "Настройка аудита для модели '" + request.modelName() + "' уже существует");
        }

        AuditSetting setting = AuditSetting.builder()
                .modelName(request.modelName())
                .trackCreate(request.trackCreate() != null ? request.trackCreate() : true)
                .trackUpdate(request.trackUpdate() != null ? request.trackUpdate() : true)
                .trackDelete(request.trackDelete() != null ? request.trackDelete() : true)
                .trackRead(request.trackRead() != null ? request.trackRead() : false)
                .retentionDays(request.retentionDays() != null ? request.retentionDays() : 365)
                .build();

        setting = auditSettingRepository.save(setting);
        auditService.logCreate("AuditSetting", setting.getId());

        log.info("Audit setting created for model: {} ({})", setting.getModelName(), setting.getId());
        return AuditSettingResponse.fromEntity(setting);
    }

    @Transactional
    public AuditSettingResponse updateSetting(UUID id, UpdateAuditSettingRequest request) {
        AuditSetting setting = auditSettingRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Настройка аудита не найдена: " + id));

        if (request.trackCreate() != null) {
            setting.setTrackCreate(request.trackCreate());
        }
        if (request.trackUpdate() != null) {
            setting.setTrackUpdate(request.trackUpdate());
        }
        if (request.trackDelete() != null) {
            setting.setTrackDelete(request.trackDelete());
        }
        if (request.trackRead() != null) {
            setting.setTrackRead(request.trackRead());
        }
        if (request.retentionDays() != null) {
            setting.setRetentionDays(request.retentionDays());
        }
        if (request.isActive() != null) {
            setting.setActive(request.isActive());
        }

        setting = auditSettingRepository.save(setting);
        auditService.logUpdate("AuditSetting", setting.getId(), "multiple", null, null);

        log.info("Audit setting updated for model: {} ({})", setting.getModelName(), setting.getId());
        return AuditSettingResponse.fromEntity(setting);
    }

    @Transactional
    public void deleteSetting(UUID id) {
        AuditSetting setting = auditSettingRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Настройка аудита не найдена: " + id));

        setting.softDelete();
        auditSettingRepository.save(setting);
        auditService.logDelete("AuditSetting", setting.getId());

        log.info("Audit setting deleted for model: {} ({})", setting.getModelName(), setting.getId());
    }

    /**
     * Checks whether tracking is enabled for a specific model and action.
     */
    @Transactional(readOnly = true)
    public boolean isTrackingEnabled(String modelName, String action) {
        return auditSettingRepository.findByModelNameAndDeletedFalse(modelName)
                .map(setting -> {
                    if (!setting.isActive()) {
                        return false;
                    }
                    return switch (action.toUpperCase()) {
                        case "CREATE" -> setting.isTrackCreate();
                        case "UPDATE" -> setting.isTrackUpdate();
                        case "DELETE" -> setting.isTrackDelete();
                        case "READ" -> setting.isTrackRead();
                        default -> false;
                    };
                })
                .orElse(false); // If no setting exists, tracking is disabled
    }
}
