package com.privod.platform.modules.apiManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.apiManagement.domain.ApiKey;
import com.privod.platform.modules.apiManagement.repository.ApiKeyRepository;
import com.privod.platform.modules.apiManagement.web.dto.ApiKeyCreatedResponse;
import com.privod.platform.modules.apiManagement.web.dto.ApiKeyResponse;
import com.privod.platform.modules.apiManagement.web.dto.CreateApiKeyRequest;
import com.privod.platform.modules.auth.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional(readOnly = true)
    public ApiKeyResponse findById(UUID id) {
        ApiKey apiKey = getApiKeyOrThrow(id);
        ensureCanAccessKey(apiKey);
        return ApiKeyResponse.fromEntity(apiKey);
    }

    @Transactional(readOnly = true)
    public Page<ApiKeyResponse> findByUser(UUID userId, Pageable pageable) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        UUID targetUserId = (userId != null) ? userId : currentUserId;
        if (!targetUserId.equals(currentUserId)) {
            // Allow tenant admins to view keys of users within the same organization.
            if (!SecurityUtils.hasRole("ADMIN")) {
                throw new AccessDeniedException("Cannot access API keys for another user");
            }
            userRepository.findByIdAndOrganizationIdAndDeletedFalse(targetUserId, currentOrgId)
                    .orElseThrow(() -> new AccessDeniedException("User not found in your organization"));
        }

        return apiKeyRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(targetUserId, pageable)
                .map(ApiKeyResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ApiKeyResponse> findActiveKeys() {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        return apiKeyRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(currentUserId, Pageable.unpaged())
                .stream()
                .filter(ApiKey::isActive)
                .map(ApiKeyResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ApiKeyCreatedResponse create(CreateApiKeyRequest request) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        UUID targetUserId = request.userId();
        if (targetUserId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if (!targetUserId.equals(currentUserId)) {
            // Endpoint is ADMIN-only; still enforce tenant boundary.
            userRepository.findByIdAndOrganizationIdAndDeletedFalse(targetUserId, currentOrgId)
                    .orElseThrow(() -> new AccessDeniedException("User not found in your organization"));
        }

        String rawKey = generateRawKey();
        String prefix = rawKey.substring(0, 8);
        String keyHash = hashKey(rawKey);

        ApiKey apiKey = ApiKey.builder()
                .name(request.name())
                .keyHash(keyHash)
                .prefix(prefix)
                .userId(targetUserId)
                .scopes(request.scopes() != null ? request.scopes() : "[]")
                .isActive(true)
                .expiresAt(request.expiresAt())
                .rateLimit(request.rateLimit() != null ? request.rateLimit() : 60)
                .build();

        apiKey = apiKeyRepository.save(apiKey);
        auditService.logCreate("ApiKey", apiKey.getId());

        log.info("API key created: {} (prefix: {}, user: {})", apiKey.getName(), prefix, request.userId());
        return new ApiKeyCreatedResponse(
                apiKey.getId(),
                apiKey.getName(),
                prefix,
                rawKey,
                "API ключ создан. Сохраните его - он не будет показан повторно."
        );
    }

    @Transactional
    public ApiKeyResponse deactivate(UUID id) {
        ApiKey apiKey = getApiKeyOrThrow(id);
        ensureCanAccessKey(apiKey);
        apiKey.setActive(false);
        apiKey = apiKeyRepository.save(apiKey);
        auditService.logStatusChange("ApiKey", id, "ACTIVE", "INACTIVE");

        log.info("API key deactivated: {} ({})", apiKey.getName(), id);
        return ApiKeyResponse.fromEntity(apiKey);
    }

    @Transactional
    public ApiKeyResponse recordUsage(UUID id) {
        ApiKey apiKey = getApiKeyOrThrow(id);
        apiKey.setLastUsedAt(Instant.now());
        apiKey.setRequestCount(apiKey.getRequestCount() + 1);
        apiKey = apiKeyRepository.save(apiKey);
        return ApiKeyResponse.fromEntity(apiKey);
    }

    @Transactional
    public void delete(UUID id) {
        ApiKey apiKey = getApiKeyOrThrow(id);
        ensureCanAccessKey(apiKey);
        apiKey.softDelete();
        apiKeyRepository.save(apiKey);
        auditService.logDelete("ApiKey", id);
        log.info("API key soft-deleted: {} ({})", apiKey.getName(), id);
    }

    private void ensureCanAccessKey(ApiKey apiKey) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        if (apiKey.getUserId().equals(currentUserId)) {
            return;
        }
        if (!SecurityUtils.hasRole("ADMIN")) {
            throw new AccessDeniedException("Access denied");
        }

        // Tenant admins can manage keys only for users within their organization.
        userRepository.findByIdAndOrganizationIdAndDeletedFalse(apiKey.getUserId(), currentOrgId)
                .orElseThrow(() -> new AccessDeniedException("Access denied"));
    }

    private ApiKey getApiKeyOrThrow(UUID id) {
        return apiKeyRepository.findById(id)
                .filter(k -> !k.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("API ключ не найден: " + id));
    }

    private String generateRawKey() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return "pvd_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
