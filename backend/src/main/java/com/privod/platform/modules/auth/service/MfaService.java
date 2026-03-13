package com.privod.platform.modules.auth.service;

import com.privod.platform.modules.auth.domain.MfaAttempt;
import com.privod.platform.modules.auth.domain.MfaConfig;
import com.privod.platform.modules.auth.domain.MfaMethod;
import com.privod.platform.modules.auth.repository.MfaAttemptRepository;
import com.privod.platform.modules.auth.repository.MfaConfigRepository;
import com.privod.platform.modules.auth.web.dto.EnableMfaRequest;
import com.privod.platform.modules.auth.web.dto.MfaConfigResponse;
import com.privod.platform.modules.auth.web.dto.VerifyMfaRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * MfaService manages MFA configuration entities (MfaConfig, MfaAttempt).
 * TOTP operations (secret generation, code verification) are delegated to TwoFactorService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MfaService {

    private final MfaConfigRepository mfaConfigRepository;
    private final MfaAttemptRepository mfaAttemptRepository;
    private final TwoFactorService twoFactorService;

    @Transactional
    public MfaConfigResponse enableMfa(EnableMfaRequest request) {
        var existing = mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(
                request.userId(), request.method());

        MfaConfig config;
        if (existing.isPresent()) {
            config = existing.get();
        } else {
            config = MfaConfig.builder()
                    .userId(request.userId())
                    .method(request.method())
                    .build();
        }

        config.setSecret(generateSecret());
        config.setBackupCodes(generateBackupCodes());
        config.enable();

        config = mfaConfigRepository.save(config);
        log.info("MFA enabled for user {} via method {}", request.userId(), request.method());
        return MfaConfigResponse.fromEntity(config);
    }

    @Transactional
    public void disableMfa(UUID userId, MfaMethod method) {
        MfaConfig config = mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(userId, method)
                .orElseThrow(() -> new EntityNotFoundException(
                        "MFA конфигурация не найдена для пользователя: " + userId));

        config.disable();
        mfaConfigRepository.save(config);
        log.info("MFA disabled for user {} method {}", userId, method);
    }

    @Transactional
    public boolean verify(VerifyMfaRequest request, String ipAddress, String userAgent) {
        MfaConfig config = mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(
                        request.userId(), request.method())
                .orElseThrow(() -> new EntityNotFoundException(
                        "MFA конфигурация не найдена для пользователя: " + request.userId()));

        if (!config.isEnabled()) {
            throw new IllegalStateException("MFA не включена для пользователя: " + request.userId());
        }

        // Verify TOTP code (delegated to TwoFactorService) or backup code
        boolean isValid = verifyCode(config, request.code());

        // Log the attempt
        MfaAttempt attempt = MfaAttempt.builder()
                .userId(request.userId())
                .method(request.method())
                .code(request.code())
                .isSuccessful(isValid)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .attemptedAt(Instant.now())
                .build();
        mfaAttemptRepository.save(attempt);

        if (isValid) {
            log.info("MFA verification successful for user {} via {}", request.userId(), request.method());
        } else {
            log.warn("MFA verification failed for user {} via {}", request.userId(), request.method());
        }

        return isValid;
    }

    @Transactional(readOnly = true)
    public List<MfaConfigResponse> getUserMfaConfigs(UUID userId) {
        return mfaConfigRepository.findByUserIdAndDeletedFalse(userId)
                .stream()
                .map(MfaConfigResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean hasMfaEnabled(UUID userId) {
        return mfaConfigRepository.existsByUserIdAndIsEnabledTrueAndDeletedFalse(userId);
    }

    @Transactional(readOnly = true)
    public long getRecentFailedAttempts(UUID userId, int minutes) {
        Instant after = Instant.now().minus(minutes, ChronoUnit.MINUTES);
        return mfaAttemptRepository.countByUserIdAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
                userId, after);
    }

    private boolean verifyCode(MfaConfig config, String code) {
        // Check backup codes first
        List<String> backupCodes = new ArrayList<>(config.getBackupCodes());
        if (backupCodes.contains(code.toUpperCase())) {
            backupCodes.remove(code.toUpperCase());
            config.setBackupCodes(backupCodes);
            mfaConfigRepository.save(config);
            return true;
        }

        // Delegate TOTP verification to TwoFactorService (RFC 6238)
        return twoFactorService.verifyCode(config.getSecret(), code);
    }

    private String generateSecret() {
        return twoFactorService.generateSecret();
    }

    private List<String> generateBackupCodes() {
        return twoFactorService.generateRecoveryCodes();
    }
}
