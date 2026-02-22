package com.privod.platform.modules.auth.service;

import com.privod.platform.modules.auth.domain.MfaConfig;
import com.privod.platform.modules.auth.domain.MfaMethod;
import com.privod.platform.modules.auth.repository.MfaAttemptRepository;
import com.privod.platform.modules.auth.repository.MfaConfigRepository;
import com.privod.platform.modules.auth.web.dto.EnableMfaRequest;
import com.privod.platform.modules.auth.web.dto.EnableMfaResponse;
import com.privod.platform.modules.auth.web.dto.MfaConfigResponse;
import com.privod.platform.modules.auth.web.dto.VerifyMfaRequest;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.secret.SecretGenerator;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MfaServiceTest {

    @Mock
    private MfaConfigRepository mfaConfigRepository;

    @Mock
    private MfaAttemptRepository mfaAttemptRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private CodeVerifier codeVerifier;

    @Mock
    private SecretGenerator secretGenerator;

    private MfaService mfaService;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final String IP_ADDRESS = "127.0.0.1";
    private static final String USER_AGENT = "JUnit/5";
    private static final String GENERATED_SECRET = "JBSWY3DPEHPK3PXP";

    @BeforeEach
    void setUp() throws Exception {
        // Construct the service normally (it creates its own CodeVerifier/SecretGenerator internally)
        mfaService = new MfaService(mfaConfigRepository, mfaAttemptRepository, passwordEncoder);

        // Replace internal fields with mocks so we can control TOTP verification and secret generation
        setField(mfaService, "codeVerifier", codeVerifier);
        setField(mfaService, "secretGenerator", secretGenerator);
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private MfaConfig buildEnabledConfig(UUID userId) {
        MfaConfig config = MfaConfig.builder()
                .userId(userId)
                .method(MfaMethod.TOTP)
                .secret(GENERATED_SECRET)
                .isEnabled(true)
                .backupCodes(new ArrayList<>(List.of("$2a$HASH1", "$2a$HASH2")))
                .build();
        config.setId(UUID.randomUUID());
        config.setCreatedAt(Instant.now());
        config.setEnabledAt(Instant.now());
        return config;
    }

    // -----------------------------------------------------------------------
    @Nested
    @DisplayName("enableMfa")
    class EnableMfa {

        @Test
        @DisplayName("should generate secret, backup codes, and return provisioning URI for new config")
        void enableMfa_NewConfig() {
            EnableMfaRequest request = new EnableMfaRequest(USER_ID, MfaMethod.TOTP);
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.empty());
            when(secretGenerator.generate()).thenReturn(GENERATED_SECRET);
            when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "$2a$" + inv.getArgument(0));

            MfaConfig savedConfig = MfaConfig.builder()
                    .userId(USER_ID)
                    .method(MfaMethod.TOTP)
                    .secret(GENERATED_SECRET)
                    .isEnabled(true)
                    .build();
            savedConfig.setId(UUID.randomUUID());
            savedConfig.setCreatedAt(Instant.now());
            savedConfig.setEnabledAt(Instant.now());

            when(mfaConfigRepository.save(any(MfaConfig.class))).thenReturn(savedConfig);

            EnableMfaResponse response = mfaService.enableMfa(request);

            assertThat(response).isNotNull();
            assertThat(response.userId()).isEqualTo(USER_ID);
            assertThat(response.method()).isEqualTo(MfaMethod.TOTP);
            assertThat(response.isEnabled()).isTrue();
            assertThat(response.secret()).isEqualTo(GENERATED_SECRET);
            assertThat(response.provisioningUri()).contains("otpauth://totp/");
            assertThat(response.provisioningUri()).contains(GENERATED_SECRET);
            assertThat(response.backupCodes()).hasSize(10);
            assertThat(response.totalBackupCodes()).isEqualTo(10);
            verify(mfaConfigRepository).save(any(MfaConfig.class));
        }

        @Test
        @DisplayName("should re-enable existing config instead of creating a new one")
        void enableMfa_ExistingConfig() {
            EnableMfaRequest request = new EnableMfaRequest(USER_ID, MfaMethod.TOTP);
            MfaConfig existingConfig = MfaConfig.builder()
                    .userId(USER_ID)
                    .method(MfaMethod.TOTP)
                    .build();
            existingConfig.setId(UUID.randomUUID());
            existingConfig.setCreatedAt(Instant.now());

            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.of(existingConfig));
            when(secretGenerator.generate()).thenReturn(GENERATED_SECRET);
            when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "$2a$" + inv.getArgument(0));

            MfaConfig saved = MfaConfig.builder()
                    .userId(USER_ID)
                    .method(MfaMethod.TOTP)
                    .secret(GENERATED_SECRET)
                    .isEnabled(true)
                    .build();
            saved.setId(existingConfig.getId());
            saved.setCreatedAt(existingConfig.getCreatedAt());
            saved.setEnabledAt(Instant.now());

            when(mfaConfigRepository.save(any(MfaConfig.class))).thenReturn(saved);

            EnableMfaResponse response = mfaService.enableMfa(request);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(existingConfig.getId());
            assertThat(response.isEnabled()).isTrue();
        }

        @Test
        @DisplayName("should hash all backup codes before persisting")
        void enableMfa_BackupCodesAreHashed() {
            EnableMfaRequest request = new EnableMfaRequest(USER_ID, MfaMethod.TOTP);
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.empty());
            when(secretGenerator.generate()).thenReturn(GENERATED_SECRET);
            when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "$2a$10$hash_of_" + inv.getArgument(0));

            MfaConfig savedConfig = buildEnabledConfig(USER_ID);
            when(mfaConfigRepository.save(any(MfaConfig.class))).thenReturn(savedConfig);

            mfaService.enableMfa(request);

            ArgumentCaptor<MfaConfig> captor = ArgumentCaptor.forClass(MfaConfig.class);
            verify(mfaConfigRepository).save(captor.capture());

            MfaConfig captured = captor.getValue();
            assertThat(captured.getBackupCodes()).hasSize(10);
            assertThat(captured.getBackupCodes()).allMatch(code -> code.startsWith("$2a$10$hash_of_"));
        }
    }

    // -----------------------------------------------------------------------
    @Nested
    @DisplayName("disableMfa")
    class DisableMfa {

        @Test
        @DisplayName("should disable config and persist it")
        void disableMfa_Success() {
            MfaConfig config = buildEnabledConfig(USER_ID);
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.of(config));

            mfaService.disableMfa(USER_ID, MfaMethod.TOTP);

            assertThat(config.isEnabled()).isFalse();
            assertThat(config.getSecret()).isNull();
            assertThat(config.getBackupCodes()).isEmpty();
            verify(mfaConfigRepository).save(config);
        }

        @Test
        @DisplayName("should throw EntityNotFoundException when config does not exist")
        void disableMfa_NotFound() {
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> mfaService.disableMfa(USER_ID, MfaMethod.TOTP))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining(USER_ID.toString());
        }
    }

    // -----------------------------------------------------------------------
    @Nested
    @DisplayName("verify")
    class Verify {

        @Test
        @DisplayName("should return true when TOTP code is valid")
        void verify_ValidTotpCode() {
            VerifyMfaRequest request = new VerifyMfaRequest(USER_ID, MfaMethod.TOTP, "123456");
            MfaConfig config = buildEnabledConfig(USER_ID);

            when(mfaAttemptRepository.countByUserIdAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
                    eq(USER_ID), any(Instant.class))).thenReturn(0L);
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.of(config));
            when(codeVerifier.isValidCode(GENERATED_SECRET, "123456")).thenReturn(true);

            boolean result = mfaService.verify(request, IP_ADDRESS, USER_AGENT);

            assertThat(result).isTrue();
            verify(mfaAttemptRepository).save(any());
        }

        @Test
        @DisplayName("should return false when TOTP code is invalid")
        void verify_InvalidTotpCode() {
            VerifyMfaRequest request = new VerifyMfaRequest(USER_ID, MfaMethod.TOTP, "000000");
            MfaConfig config = buildEnabledConfig(USER_ID);

            when(mfaAttemptRepository.countByUserIdAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
                    eq(USER_ID), any(Instant.class))).thenReturn(0L);
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.of(config));
            when(codeVerifier.isValidCode(GENERATED_SECRET, "000000")).thenReturn(false);

            boolean result = mfaService.verify(request, IP_ADDRESS, USER_AGENT);

            assertThat(result).isFalse();
            verify(mfaAttemptRepository).save(any());
        }

        @Test
        @DisplayName("should accept valid backup code and consume it")
        void verify_ValidBackupCode() {
            String backupCode = "ABCD1234";
            VerifyMfaRequest request = new VerifyMfaRequest(USER_ID, MfaMethod.TOTP, backupCode);

            MfaConfig config = buildEnabledConfig(USER_ID);
            // The config already has 2 hashed backup codes; make the first one match
            when(mfaAttemptRepository.countByUserIdAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
                    eq(USER_ID), any(Instant.class))).thenReturn(0L);
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.of(config));
            when(passwordEncoder.matches(backupCode, "$2a$HASH1")).thenReturn(true);

            boolean result = mfaService.verify(request, IP_ADDRESS, USER_AGENT);

            assertThat(result).isTrue();
            // The consumed code should have been removed
            assertThat(config.getBackupCodes()).hasSize(1);
            assertThat(config.getBackupCodes()).containsExactly("$2a$HASH2");
            // Config should be saved after consuming backup code
            verify(mfaConfigRepository).save(config);
        }

        @Test
        @DisplayName("should throw IllegalStateException when rate limit is exceeded")
        void verify_RateLimitExceeded() {
            VerifyMfaRequest request = new VerifyMfaRequest(USER_ID, MfaMethod.TOTP, "123456");

            when(mfaAttemptRepository.countByUserIdAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
                    eq(USER_ID), any(Instant.class))).thenReturn(5L);

            assertThatThrownBy(() -> mfaService.verify(request, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("лимит");

            verify(mfaConfigRepository, never()).findByUserIdAndMethodAndDeletedFalse(any(), any());
        }

        @Test
        @DisplayName("should throw EntityNotFoundException when MFA config does not exist")
        void verify_ConfigNotFound() {
            VerifyMfaRequest request = new VerifyMfaRequest(USER_ID, MfaMethod.TOTP, "123456");

            when(mfaAttemptRepository.countByUserIdAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
                    eq(USER_ID), any(Instant.class))).thenReturn(0L);
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> mfaService.verify(request, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining(USER_ID.toString());
        }

        @Test
        @DisplayName("should throw IllegalStateException when MFA is not enabled")
        void verify_MfaNotEnabled() {
            VerifyMfaRequest request = new VerifyMfaRequest(USER_ID, MfaMethod.TOTP, "123456");

            MfaConfig config = MfaConfig.builder()
                    .userId(USER_ID)
                    .method(MfaMethod.TOTP)
                    .secret(GENERATED_SECRET)
                    .isEnabled(false)
                    .build();
            config.setId(UUID.randomUUID());

            when(mfaAttemptRepository.countByUserIdAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
                    eq(USER_ID), any(Instant.class))).thenReturn(0L);
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(USER_ID, MfaMethod.TOTP))
                    .thenReturn(Optional.of(config));

            assertThatThrownBy(() -> mfaService.verify(request, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("не включена");
        }
    }

    // -----------------------------------------------------------------------
    @Nested
    @DisplayName("getUserMfaConfigs")
    class GetUserMfaConfigs {

        @Test
        @DisplayName("should return mapped config responses for user")
        void getUserMfaConfigs_ReturnsList() {
            MfaConfig config = buildEnabledConfig(USER_ID);
            when(mfaConfigRepository.findByUserIdAndDeletedFalse(USER_ID))
                    .thenReturn(List.of(config));

            List<MfaConfigResponse> result = mfaService.getUserMfaConfigs(USER_ID);

            assertThat(result).hasSize(1);
            MfaConfigResponse resp = result.get(0);
            assertThat(resp.userId()).isEqualTo(USER_ID);
            assertThat(resp.method()).isEqualTo(MfaMethod.TOTP);
            assertThat(resp.isEnabled()).isTrue();
            assertThat(resp.remainingBackupCodes()).isEqualTo(2);
        }

        @Test
        @DisplayName("should return empty list when user has no MFA configs")
        void getUserMfaConfigs_Empty() {
            when(mfaConfigRepository.findByUserIdAndDeletedFalse(USER_ID))
                    .thenReturn(List.of());

            List<MfaConfigResponse> result = mfaService.getUserMfaConfigs(USER_ID);

            assertThat(result).isEmpty();
        }
    }

    // -----------------------------------------------------------------------
    @Nested
    @DisplayName("hasMfaEnabled")
    class HasMfaEnabled {

        @Test
        @DisplayName("should return true when user has enabled MFA")
        void hasMfaEnabled_True() {
            when(mfaConfigRepository.existsByUserIdAndIsEnabledTrueAndDeletedFalse(USER_ID))
                    .thenReturn(true);

            assertThat(mfaService.hasMfaEnabled(USER_ID)).isTrue();
        }

        @Test
        @DisplayName("should return false when user has no enabled MFA")
        void hasMfaEnabled_False() {
            when(mfaConfigRepository.existsByUserIdAndIsEnabledTrueAndDeletedFalse(USER_ID))
                    .thenReturn(false);

            assertThat(mfaService.hasMfaEnabled(USER_ID)).isFalse();
        }
    }
}
