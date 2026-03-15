package com.privod.platform.modules.settings.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.settings.domain.FeatureFlag;
import com.privod.platform.modules.settings.repository.FeatureFlagRepository;
import com.privod.platform.modules.settings.web.dto.FeatureFlagResponse;
import com.privod.platform.modules.settings.web.dto.UpdateFeatureFlagRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;
    private final ObjectMapper objectMapper;

    /**
     * Check if a feature flag is enabled for the current authenticated user.
     * Evaluation order:
     * 1. Flag must exist and be enabled
     * 2. Flag must not be expired
     * 3. If targetUserIds is non-empty, user must be in the list
     * 4. If targetOrganizationIds is non-empty, org must be in the list
     * 5. If rolloutPercentage < 100, use consistent hashing
     */
    @Transactional(readOnly = true)
    public boolean isEnabled(String key) {
        Optional<FeatureFlag> optFlag = featureFlagRepository.findByKeyAndDeletedFalse(key);
        if (optFlag.isEmpty()) {
            return false;
        }

        FeatureFlag flag = optFlag.get();
        if (!flag.isEnabled()) {
            return false;
        }

        // Check expiration
        if (flag.getExpiresAt() != null && Instant.now().isAfter(flag.getExpiresAt())) {
            return false;
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        UUID currentOrgId = SecurityUtils.getCurrentOrganizationId().orElse(null);

        // Check user targeting
        List<String> targetUserIds = parseJsonArray(flag.getTargetUserIds());
        if (!targetUserIds.isEmpty()) {
            if (currentUserId == null) {
                return false;
            }
            return targetUserIds.contains(currentUserId.toString());
        }

        // Check organization targeting
        List<String> targetOrgIds = parseJsonArray(flag.getTargetOrganizationIds());
        if (!targetOrgIds.isEmpty()) {
            if (currentOrgId == null) {
                return false;
            }
            return targetOrgIds.contains(currentOrgId.toString());
        }

        // Check rollout percentage with consistent hashing
        Integer rollout = flag.getRolloutPercentage();
        if (rollout != null && rollout < 100) {
            if (currentUserId == null) {
                return false;
            }
            int bucket = consistentHash(key, currentUserId);
            return bucket < rollout;
        }

        return true;
    }

    /**
     * Get A/B test variant for a flag based on consistent hashing.
     * Variants are defined as a JSON object like {"A": 50, "B": 50}.
     * The weight values define the percentage distribution.
     *
     * @return variant name, or null if flag has no variants or user is not eligible
     */
    @Transactional(readOnly = true)
    public String getVariant(String key, UUID userId) {
        Optional<FeatureFlag> optFlag = featureFlagRepository.findByKeyAndDeletedFalse(key);
        if (optFlag.isEmpty()) {
            return null;
        }

        FeatureFlag flag = optFlag.get();
        if (!flag.isEnabled()) {
            return null;
        }

        if (flag.getExpiresAt() != null && Instant.now().isAfter(flag.getExpiresAt())) {
            return null;
        }

        String variantsJson = flag.getVariants();
        if (variantsJson == null || variantsJson.isBlank()) {
            return null;
        }

        Map<String, Integer> variants = parseVariantsMap(variantsJson);
        if (variants.isEmpty()) {
            return null;
        }

        int bucket = consistentHash(key, userId);

        // Walk through variants in sorted order for deterministic assignment
        int cumulative = 0;
        for (Map.Entry<String, Integer> entry : variants.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .toList()) {
            cumulative += entry.getValue();
            if (bucket < cumulative) {
                return entry.getKey();
            }
        }

        // Fallback to last variant if weights don't sum to 100
        return variants.keySet().stream().sorted().reduce((a, b) -> b).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<FeatureFlagResponse> getAll() {
        return featureFlagRepository.findAllByDeletedFalseOrderByKeyAsc()
                .stream()
                .map(FeatureFlagResponse::fromEntity)
                .toList();
    }

    @Transactional
    public FeatureFlagResponse update(String key, UpdateFeatureFlagRequest request) {
        FeatureFlag flag = featureFlagRepository.findByKeyAndDeletedFalse(key)
                .orElseThrow(() -> new EntityNotFoundException("Feature flag не найден: " + key));

        if (request.enabled() != null) {
            flag.setEnabled(request.enabled());
        }
        if (request.rolloutPercentage() != null) {
            flag.setRolloutPercentage(request.rolloutPercentage());
        }
        if (request.targetUserIds() != null) {
            flag.setTargetUserIds(request.targetUserIds());
        }
        if (request.targetOrganizationIds() != null) {
            flag.setTargetOrganizationIds(request.targetOrganizationIds());
        }
        if (request.variants() != null) {
            flag.setVariants(request.variants());
        }
        if (request.expiresAt() != null) {
            flag.setExpiresAt(request.expiresAt());
        }
        if (request.metadata() != null) {
            flag.setMetadata(request.metadata());
        }

        flag = featureFlagRepository.save(flag);
        log.info("Feature flag '{}' updated: enabled={}, rollout={}%", key, flag.isEnabled(), flag.getRolloutPercentage());
        return FeatureFlagResponse.fromEntity(flag);
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

    /**
     * Consistent hash: produces a value 0–99 for a given (flagKey, userId) pair.
     * Same inputs always produce the same output, providing stable rollout assignment.
     */
    private int consistentHash(String flagKey, UUID userId) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest((flagKey + ":" + userId.toString()).getBytes(StandardCharsets.UTF_8));
            // Use first 4 bytes as unsigned int, mod 100
            int value = ((hash[0] & 0xFF) << 24 | (hash[1] & 0xFF) << 16 | (hash[2] & 0xFF) << 8 | (hash[3] & 0xFF));
            return Math.abs(value % 100);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed to be available in all JVMs
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank() || "[]".equals(json.trim())) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse JSON array: {}", json, e);
            return List.of();
        }
    }

    private Map<String, Integer> parseVariantsMap(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse variants JSON: {}", json, e);
            return Map.of();
        }
    }
}
