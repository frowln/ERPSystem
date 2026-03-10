package com.privod.platform.modules.settings.service;

import com.privod.platform.modules.settings.domain.FeatureFlag;
import com.privod.platform.modules.settings.repository.FeatureFlagRepository;
import com.privod.platform.modules.settings.web.dto.FeatureFlagResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;

    @Transactional(readOnly = true)
    public boolean isEnabled(String key) {
        return featureFlagRepository.findByKeyAndDeletedFalse(key)
                .map(FeatureFlag::isEnabled)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<FeatureFlagResponse> getAll() {
        return featureFlagRepository.findAllByDeletedFalseOrderByKeyAsc()
                .stream()
                .map(FeatureFlagResponse::fromEntity)
                .toList();
    }

    @Transactional
    public FeatureFlagResponse setEnabled(String key, boolean enabled) {
        FeatureFlag flag = featureFlagRepository.findByKeyAndDeletedFalse(key)
                .orElseThrow(() -> new EntityNotFoundException("Feature flag не найден: " + key));

        flag.setEnabled(enabled);
        flag = featureFlagRepository.save(flag);

        log.info("Feature flag '{}' set to enabled={}", key, enabled);
        return FeatureFlagResponse.fromEntity(flag);
    }
}
