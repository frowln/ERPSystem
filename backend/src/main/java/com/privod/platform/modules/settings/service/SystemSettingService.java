package com.privod.platform.modules.settings.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.settings.domain.SettingCategory;
import com.privod.platform.modules.settings.domain.SettingType;
import com.privod.platform.modules.settings.domain.SystemSetting;
import com.privod.platform.modules.settings.repository.SystemSettingRepository;
import com.privod.platform.modules.settings.web.dto.SystemSettingResponse;
import com.privod.platform.modules.settings.web.dto.UpdateSystemSettingRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service("settings2SystemSettingService")
@RequiredArgsConstructor
@Slf4j
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;
    private final SettingEncryptionService encryptionService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getAll() {
        return systemSettingRepository.findByDeletedFalseOrderByCategoryAscSettingKeyAsc()
                .stream()
                .map(SystemSettingResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getByCategory(SettingCategory category) {
        return systemSettingRepository.findByCategoryAndDeletedFalseOrderBySettingKeyAsc(category)
                .stream()
                .map(SystemSettingResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public SystemSettingResponse getByKey(String key) {
        SystemSetting setting = getSettingOrThrow(key);
        return SystemSettingResponse.fromEntity(setting);
    }

    @Transactional(readOnly = true)
    public String getValue(String key) {
        SystemSetting setting = getSettingOrThrow(key);
        String value = setting.getSettingValue();
        if (setting.isEncrypted() && value != null && !value.isEmpty()) {
            value = encryptionService.decrypt(value);
        }
        return value;
    }

    @Transactional(readOnly = true)
    public String getValue(String key, String defaultValue) {
        return systemSettingRepository.findBySettingKeyAndDeletedFalse(key)
                .map(setting -> {
                    String value = setting.getSettingValue();
                    if (setting.isEncrypted() && value != null && !value.isEmpty()) {
                        value = encryptionService.decrypt(value);
                    }
                    return (value != null && !value.isEmpty()) ? value : defaultValue;
                })
                .orElse(defaultValue);
    }

    @Transactional
    public SystemSettingResponse updateSetting(String key, UpdateSystemSettingRequest request) {
        SystemSetting setting = getSettingOrThrow(key);

        if (!setting.isEditable()) {
            throw new IllegalStateException("Настройка '" + setting.getDisplayName() + "' не подлежит редактированию");
        }

        String oldValue = setting.getSettingValue();
        String newValue = request.value();

        // Validate value based on type
        validateSettingValue(setting.getSettingType(), newValue);

        // Encrypt if necessary
        if (setting.isEncrypted() || setting.getSettingType() == SettingType.SECRET) {
            newValue = encryptionService.encrypt(newValue);
        }

        setting.setSettingValue(newValue);
        setting = systemSettingRepository.save(setting);

        auditService.logUpdate("SystemSetting", setting.getId(), key,
                setting.isEncrypted() ? "***" : oldValue,
                setting.isEncrypted() ? "***" : newValue);

        log.info("System setting updated: {}", key);
        return SystemSettingResponse.fromEntity(setting);
    }

    @Transactional(readOnly = true)
    public SystemSettingResponse getById(UUID id) {
        SystemSetting setting = systemSettingRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Настройка не найдена: " + id));
        return SystemSettingResponse.fromEntity(setting);
    }

    private SystemSetting getSettingOrThrow(String key) {
        return systemSettingRepository.findBySettingKeyAndDeletedFalse(key)
                .orElseThrow(() -> new EntityNotFoundException("Настройка не найдена: " + key));
    }

    private void validateSettingValue(SettingType type, String value) {
        if (value == null) return;
        switch (type) {
            case INTEGER -> {
                try {
                    Integer.parseInt(value);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Значение должно быть целым числом");
                }
            }
            case BOOLEAN -> {
                if (!"true".equalsIgnoreCase(value) && !"false".equalsIgnoreCase(value)) {
                    throw new IllegalArgumentException("Значение должно быть true или false");
                }
            }
            case JSON -> {
                if (!value.trim().startsWith("{") && !value.trim().startsWith("[")) {
                    throw new IllegalArgumentException("Значение должно быть валидным JSON");
                }
            }
            default -> {
                // STRING and SECRET accept any value
            }
        }
    }
}
