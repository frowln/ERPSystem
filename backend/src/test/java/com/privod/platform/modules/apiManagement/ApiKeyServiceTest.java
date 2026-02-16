package com.privod.platform.modules.apiManagement;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.apiManagement.domain.ApiKey;
import com.privod.platform.modules.apiManagement.repository.ApiKeyRepository;
import com.privod.platform.modules.apiManagement.service.ApiKeyService;
import com.privod.platform.modules.apiManagement.web.dto.ApiKeyCreatedResponse;
import com.privod.platform.modules.apiManagement.web.dto.ApiKeyResponse;
import com.privod.platform.modules.apiManagement.web.dto.CreateApiKeyRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApiKeyServiceTest {

    @Mock
    private ApiKeyRepository apiKeyRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ApiKeyService apiKeyService;

    private UUID keyId;
    private UUID userId;
    private ApiKey testApiKey;

    @BeforeEach
    void setUp() {
        keyId = UUID.randomUUID();
        userId = UUID.randomUUID();

        testApiKey = ApiKey.builder()
                .name("Production Key")
                .keyHash("hashed_key_value")
                .prefix("pvd_abcd")
                .userId(userId)
                .scopes("[\"read\",\"write\"]")
                .isActive(true)
                .rateLimit(120)
                .requestCount(0)
                .build();
        testApiKey.setId(keyId);
        testApiKey.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create API Key")
    class CreateApiKeyTests {

        @Test
        @DisplayName("Should create API key with generated hash, prefix, and raw key")
        void create_GeneratesHashAndPrefix() {
            CreateApiKeyRequest request = new CreateApiKeyRequest(
                    "Test Key", userId, "[\"read\"]", null, null
            );

            when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> {
                ApiKey key = inv.getArgument(0);
                key.setId(UUID.randomUUID());
                key.setCreatedAt(Instant.now());
                return key;
            });

            ApiKeyCreatedResponse response = apiKeyService.create(request);

            assertThat(response.name()).isEqualTo("Test Key");
            assertThat(response.prefix()).isNotNull().hasSize(8);
            assertThat(response.rawKey()).isNotNull().startsWith("pvd_");
            assertThat(response.rawKey()).hasSizeGreaterThan(10);
            assertThat(response.id()).isNotNull();
            assertThat(response.message()).contains("API ключ создан");
            verify(auditService).logCreate(eq("ApiKey"), any(UUID.class));
        }

        @Test
        @DisplayName("Should apply default scopes and rate limit when not provided")
        void create_AppliesDefaults() {
            CreateApiKeyRequest request = new CreateApiKeyRequest(
                    "Default Key", userId, null, null, null
            );

            when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> {
                ApiKey key = inv.getArgument(0);
                key.setId(UUID.randomUUID());
                key.setCreatedAt(Instant.now());
                return key;
            });

            ApiKeyCreatedResponse response = apiKeyService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.rawKey()).startsWith("pvd_");
        }

        @Test
        @DisplayName("Should generate unique keys on each invocation")
        void create_GeneratesUniqueKeys() {
            CreateApiKeyRequest request = new CreateApiKeyRequest(
                    "Unique Key", userId, null, null, null
            );

            when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> {
                ApiKey key = inv.getArgument(0);
                key.setId(UUID.randomUUID());
                key.setCreatedAt(Instant.now());
                return key;
            });

            ApiKeyCreatedResponse response1 = apiKeyService.create(request);
            ApiKeyCreatedResponse response2 = apiKeyService.create(request);

            assertThat(response1.rawKey()).isNotEqualTo(response2.rawKey());
        }
    }

    @Nested
    @DisplayName("Deactivate Key")
    class DeactivateKeyTests {

        @Test
        @DisplayName("Should deactivate active key")
        void deactivate_SetsInactive() {
            when(apiKeyRepository.findById(keyId)).thenReturn(Optional.of(testApiKey));
            when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> inv.getArgument(0));

            ApiKeyResponse response = apiKeyService.deactivate(keyId);

            assertThat(response.isActive()).isFalse();
            verify(auditService).logStatusChange("ApiKey", keyId, "ACTIVE", "INACTIVE");
        }

        @Test
        @DisplayName("Should throw when key not found")
        void deactivate_NotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            when(apiKeyRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> apiKeyService.deactivate(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("API ключ не найден");
        }
    }

    @Nested
    @DisplayName("Record Usage")
    class RecordUsageTests {

        @Test
        @DisplayName("Should increment request count and set lastUsedAt")
        void recordUsage_IncrementsCount() {
            when(apiKeyRepository.findById(keyId)).thenReturn(Optional.of(testApiKey));
            when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> inv.getArgument(0));

            ApiKeyResponse response = apiKeyService.recordUsage(keyId);

            assertThat(response.requestCount()).isEqualTo(1);
            assertThat(response.lastUsedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should increment count from existing value")
        void recordUsage_IncrementFromExisting() {
            testApiKey.setRequestCount(99);
            when(apiKeyRepository.findById(keyId)).thenReturn(Optional.of(testApiKey));
            when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> inv.getArgument(0));

            ApiKeyResponse response = apiKeyService.recordUsage(keyId);

            assertThat(response.requestCount()).isEqualTo(100);
        }
    }

    @Nested
    @DisplayName("Delete Key")
    class DeleteKeyTests {

        @Test
        @DisplayName("Should soft-delete API key")
        void delete_SoftDeletes() {
            when(apiKeyRepository.findById(keyId)).thenReturn(Optional.of(testApiKey));
            when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> inv.getArgument(0));

            apiKeyService.delete(keyId);

            assertThat(testApiKey.isDeleted()).isTrue();
            verify(auditService).logDelete("ApiKey", keyId);
        }
    }
}
