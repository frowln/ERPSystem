package com.privod.platform.modules.auth;

import com.privod.platform.modules.auth.domain.MfaAttempt;
import com.privod.platform.modules.auth.domain.MfaConfig;
import com.privod.platform.modules.auth.domain.MfaMethod;
import com.privod.platform.modules.auth.repository.MfaAttemptRepository;
import com.privod.platform.modules.auth.repository.MfaConfigRepository;
import com.privod.platform.modules.auth.service.MfaService;
import com.privod.platform.modules.auth.web.dto.EnableMfaRequest;
import com.privod.platform.modules.auth.web.dto.MfaConfigResponse;
import com.privod.platform.modules.auth.web.dto.VerifyMfaRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MfaServiceTest {

    @Mock
    private MfaConfigRepository mfaConfigRepository;

    @Mock
    private MfaAttemptRepository mfaAttemptRepository;

    @InjectMocks
    private MfaService mfaService;

    private UUID userId;
    private MfaConfig testConfig;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        testConfig = MfaConfig.builder()
                .userId(userId)
                .method(MfaMethod.TOTP)
                .secret("dGVzdC1zZWNyZXQtdmFsdWU=")
                .isEnabled(true)
                .enabledAt(Instant.now())
                .backupCodes(List.of("CODE0001", "CODE0002", "CODE0003"))
                .build();
        testConfig.setId(UUID.randomUUID());
        testConfig.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Enable MFA")
    class EnableTests {

        @Test
        @DisplayName("Should enable MFA with TOTP method")
        void enableMfa_TOTP_Success() {
            EnableMfaRequest request = new EnableMfaRequest(userId, MfaMethod.TOTP);

            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(userId, MfaMethod.TOTP))
                    .thenReturn(Optional.empty());
            when(mfaConfigRepository.save(any(MfaConfig.class))).thenAnswer(inv -> {
                MfaConfig c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            MfaConfigResponse response = mfaService.enableMfa(request);

            assertThat(response.method()).isEqualTo(MfaMethod.TOTP);
            assertThat(response.methodDisplayName()).isEqualTo("Приложение (TOTP)");
            assertThat(response.isEnabled()).isTrue();
            assertThat(response.backupCodes()).isNotEmpty();
        }

        @Test
        @DisplayName("Should re-enable existing disabled MFA config")
        void enableMfa_ReEnable() {
            testConfig.setEnabled(false);
            EnableMfaRequest request = new EnableMfaRequest(userId, MfaMethod.TOTP);

            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(userId, MfaMethod.TOTP))
                    .thenReturn(Optional.of(testConfig));
            when(mfaConfigRepository.save(any(MfaConfig.class))).thenAnswer(inv -> inv.getArgument(0));

            MfaConfigResponse response = mfaService.enableMfa(request);

            assertThat(response.isEnabled()).isTrue();
            assertThat(response.enabledAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Disable MFA")
    class DisableTests {

        @Test
        @DisplayName("Should disable MFA")
        void disableMfa_Success() {
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(userId, MfaMethod.TOTP))
                    .thenReturn(Optional.of(testConfig));
            when(mfaConfigRepository.save(any(MfaConfig.class))).thenAnswer(inv -> inv.getArgument(0));

            mfaService.disableMfa(userId, MfaMethod.TOTP);

            verify(mfaConfigRepository).save(any(MfaConfig.class));
        }

        @Test
        @DisplayName("Should throw when config not found for disable")
        void disableMfa_NotFound() {
            UUID unknownUser = UUID.randomUUID();
            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(unknownUser, MfaMethod.TOTP))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> mfaService.disableMfa(unknownUser, MfaMethod.TOTP))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("MFA конфигурация не найдена");
        }
    }

    @Nested
    @DisplayName("Verify MFA")
    class VerifyTests {

        @Test
        @DisplayName("Should verify valid TOTP code")
        void verify_ValidCode() {
            VerifyMfaRequest request = new VerifyMfaRequest(userId, MfaMethod.TOTP, "123456");

            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(userId, MfaMethod.TOTP))
                    .thenReturn(Optional.of(testConfig));
            when(mfaAttemptRepository.save(any(MfaAttempt.class))).thenAnswer(inv -> {
                MfaAttempt a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            boolean result = mfaService.verify(request, "127.0.0.1", "TestAgent");

            assertThat(result).isTrue();
            verify(mfaAttemptRepository).save(any(MfaAttempt.class));
        }

        @Test
        @DisplayName("Should verify backup code")
        void verify_BackupCode() {
            VerifyMfaRequest request = new VerifyMfaRequest(userId, MfaMethod.TOTP, "CODE0001");

            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(userId, MfaMethod.TOTP))
                    .thenReturn(Optional.of(testConfig));
            when(mfaConfigRepository.save(any(MfaConfig.class))).thenAnswer(inv -> inv.getArgument(0));
            when(mfaAttemptRepository.save(any(MfaAttempt.class))).thenAnswer(inv -> {
                MfaAttempt a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            boolean result = mfaService.verify(request, "127.0.0.1", "TestAgent");

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should throw when MFA config not found for verification")
        void verify_ConfigNotFound() {
            UUID unknownUser = UUID.randomUUID();
            VerifyMfaRequest request = new VerifyMfaRequest(unknownUser, MfaMethod.TOTP, "123456");

            when(mfaConfigRepository.findByUserIdAndMethodAndDeletedFalse(unknownUser, MfaMethod.TOTP))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> mfaService.verify(request, "127.0.0.1", "TestAgent"))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("MFA Status")
    class StatusTests {

        @Test
        @DisplayName("Should check MFA enabled status")
        void hasMfaEnabled_True() {
            when(mfaConfigRepository.existsByUserIdAndIsEnabledTrueAndDeletedFalse(userId))
                    .thenReturn(true);

            boolean result = mfaService.hasMfaEnabled(userId);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false when MFA not enabled")
        void hasMfaEnabled_False() {
            UUID otherUser = UUID.randomUUID();
            when(mfaConfigRepository.existsByUserIdAndIsEnabledTrueAndDeletedFalse(otherUser))
                    .thenReturn(false);

            boolean result = mfaService.hasMfaEnabled(otherUser);

            assertThat(result).isFalse();
        }
    }
}
