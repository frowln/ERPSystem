package com.privod.platform.modules.admin.service;

import com.privod.platform.modules.settings.domain.SettingCategory;
import com.privod.platform.modules.settings.domain.SettingType;
import com.privod.platform.modules.settings.domain.SystemSetting;
import com.privod.platform.modules.settings.repository.SystemSettingRepository;
import com.privod.platform.modules.admin.web.dto.SystemSettingResponse;
import com.privod.platform.modules.admin.web.dto.UpdateSettingRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service("adminSystemSettingService")
@RequiredArgsConstructor
@Slf4j
public class SystemSettingService {
    private final SystemSettingRepository settingRepository;

    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getAllSettings() {
        return settingRepository.findByDeletedFalseOrderByCategoryAscSettingKeyAsc()
                .stream().map(SystemSettingResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, List<SystemSettingResponse>> getSettingsGrouped() {
        return settingRepository.findByDeletedFalseOrderByCategoryAscSettingKeyAsc()
                .stream().map(SystemSettingResponse::fromEntity)
                .collect(Collectors.groupingBy(s -> s.category() != null ? s.category() : "other"));
    }

    @Transactional(readOnly = true)
    public String getSettingValue(String key, String defaultValue) {
        return settingRepository.findBySettingKeyAndDeletedFalse(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getSettingsByCategory(String category) {
        try {
            SettingCategory cat = SettingCategory.valueOf(category.toUpperCase());
            return settingRepository.findByCategoryAndDeletedFalseOrderBySettingKeyAsc(cat)
                    .stream().map(SystemSettingResponse::fromEntity).toList();
        } catch (IllegalArgumentException e) {
            return List.of();
        }
    }

    @Transactional
    public SystemSettingResponse updateSetting(String key, UpdateSettingRequest request) {
        SystemSetting setting = settingRepository.findBySettingKeyAndDeletedFalse(key)
                .orElseThrow(() -> new EntityNotFoundException("Настройка не найдена: " + key));

        setting.setSettingValue(request.value());

        setting = settingRepository.save(setting);
        log.info("System setting updated: {} = {}", key, request.value());
        return SystemSettingResponse.fromEntity(setting);
    }

    @Transactional
    public SystemSettingResponse createSetting(String key, String value, String type, String category, String description) {
        if (settingRepository.existsBySettingKeyAndDeletedFalse(key)) {
            throw new IllegalStateException("Настройка уже существует: " + key);
        }

        SystemSetting setting = SystemSetting.builder()
                .settingKey(key)
                .settingValue(value)
                .settingType(type != null ? SettingType.valueOf(type.toUpperCase()) : SettingType.STRING)
                .category(category != null ? SettingCategory.valueOf(category.toUpperCase()) : SettingCategory.GENERAL)
                .displayName(key)
                .description(description)
                .build();

        setting = settingRepository.save(setting);
        log.info("System setting created: {}", key);
        return SystemSettingResponse.fromEntity(setting);
    }
}
