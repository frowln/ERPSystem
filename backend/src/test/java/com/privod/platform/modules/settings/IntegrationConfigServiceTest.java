package com.privod.platform.modules.settings;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.settings.domain.IntegrationConfig;
import com.privod.platform.modules.settings.domain.IntegrationType;
import com.privod.platform.modules.settings.domain.SyncStatus;
import com.privod.platform.modules.settings.repository.IntegrationConfigRepository;
import com.privod.platform.modules.settings.service.IntegrationConfigService;
import com.privod.platform.modules.settings.service.SettingEncryptionService;
import com.privod.platform.modules.settings.web.dto.CreateIntegrationConfigRequest;
import com.privod.platform.modules.settings.web.dto.IntegrationConfigResponse;
import com.privod.platform.modules.settings.web.dto.UpdateIntegrationConfigRequest;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IntegrationConfigServiceTest {

    @Mock
    private IntegrationConfigRepository integrationConfigRepository;

    @Mock
    private SettingEncryptionService encryptionService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private IntegrationConfigService integrationConfigService;

    private IntegrationConfig oneC;
    private UUID configId;

    @BeforeEach
    void setUp() {
        configId = UUID.randomUUID();

        oneC = IntegrationConfig.builder()
                .code("1c_integration")
                .name("Интеграция с 1С")
                .integrationType(IntegrationType.REST_API)
                .baseUrl("https://1c.example.com/api")
                .apiKey("enc_key")
                .apiSecret("enc_secret")
                .isActive(true)
                .syncStatus(SyncStatus.IDLE)
                .configJson(Map.of("version", "8.3"))
                .build();
        oneC.setId(configId);
        oneC.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Integration CRUD")
    class IntegrationCrudTests {

        @Test
        @DisplayName("Should create integration config with encrypted API keys")
        void createConfig_EncryptsKeys() {
            when(integrationConfigRepository.existsByCodeAndDeletedFalse("new_api")).thenReturn(false);
            when(encryptionService.encrypt("my_key")).thenReturn("encrypted_key");
            when(encryptionService.encrypt("my_secret")).thenReturn("encrypted_secret");
            when(integrationConfigRepository.save(any(IntegrationConfig.class))).thenAnswer(inv -> {
                IntegrationConfig c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            CreateIntegrationConfigRequest request = new CreateIntegrationConfigRequest(
                    "new_api", "Новая API", IntegrationType.REST_API,
                    "https://api.example.com", "my_key", "my_secret",
                    Map.of("timeout", 30));

            IntegrationConfigResponse result = integrationConfigService.createConfig(request);

            assertThat(result.code()).isEqualTo("new_api");
            assertThat(result.hasApiKey()).isTrue();
            assertThat(result.hasApiSecret()).isTrue();
            verify(encryptionService).encrypt("my_key");
            verify(encryptionService).encrypt("my_secret");
            verify(auditService).logCreate(eq("IntegrationConfig"), any(UUID.class));
        }

        @Test
        @DisplayName("Should list all integrations without exposing secrets")
        void listAll_MasksSecrets() {
            when(integrationConfigRepository.findByDeletedFalseOrderByNameAsc())
                    .thenReturn(List.of(oneC));

            List<IntegrationConfigResponse> result = integrationConfigService.listAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).code()).isEqualTo("1c_integration");
            assertThat(result.get(0).hasApiKey()).isTrue();
            assertThat(result.get(0).hasApiSecret()).isTrue();
            // The response record does not expose raw apiKey/apiSecret
        }

        @Test
        @DisplayName("Should reject duplicate integration code")
        void createConfig_DuplicateCode() {
            when(integrationConfigRepository.existsByCodeAndDeletedFalse("1c_integration")).thenReturn(true);

            CreateIntegrationConfigRequest request = new CreateIntegrationConfigRequest(
                    "1c_integration", "Дубль", IntegrationType.REST_API,
                    null, null, null, null);

            assertThatThrownBy(() -> integrationConfigService.createConfig(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Sync Operations")
    class SyncOperationsTests {

        @Test
        @DisplayName("Should start sync for active integration")
        void startSync_Success() {
            when(integrationConfigRepository.findByCodeAndDeletedFalse("1c_integration"))
                    .thenReturn(Optional.of(oneC));
            when(integrationConfigRepository.save(any(IntegrationConfig.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            IntegrationConfigResponse result = integrationConfigService.startSync("1c_integration");

            assertThat(result.syncStatus()).isEqualTo(SyncStatus.SYNCING);
            assertThat(oneC.getLastSyncAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject sync for inactive integration")
        void startSync_Inactive() {
            oneC.setActive(false);
            when(integrationConfigRepository.findByCodeAndDeletedFalse("1c_integration"))
                    .thenReturn(Optional.of(oneC));

            assertThatThrownBy(() -> integrationConfigService.startSync("1c_integration"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("неактивна");
        }

        @Test
        @DisplayName("Should reject sync when already syncing")
        void startSync_AlreadySyncing() {
            oneC.setSyncStatus(SyncStatus.SYNCING);
            when(integrationConfigRepository.findByCodeAndDeletedFalse("1c_integration"))
                    .thenReturn(Optional.of(oneC));

            assertThatThrownBy(() -> integrationConfigService.startSync("1c_integration"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже выполняется");
        }

        @Test
        @DisplayName("Should test connection and return status")
        void testConnection_Success() {
            when(integrationConfigRepository.findByCodeAndDeletedFalse("1c_integration"))
                    .thenReturn(Optional.of(oneC));

            Map<String, Object> result = integrationConfigService.testConnection("1c_integration");

            assertThat(result.get("success")).isEqualTo(true);
            assertThat(result.get("code")).isEqualTo("1c_integration");
        }

        @Test
        @DisplayName("Should report failure when URL is not configured")
        void testConnection_NoUrl() {
            oneC.setBaseUrl("");
            when(integrationConfigRepository.findByCodeAndDeletedFalse("1c_integration"))
                    .thenReturn(Optional.of(oneC));

            Map<String, Object> result = integrationConfigService.testConnection("1c_integration");

            assertThat(result.get("success")).isEqualTo(false);
            assertThat(result.get("message").toString()).contains("URL не настроен");
        }
    }
}
