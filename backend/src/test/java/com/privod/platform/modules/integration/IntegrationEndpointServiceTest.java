package com.privod.platform.modules.integration;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.AuthType;
import com.privod.platform.modules.integration.domain.HealthStatus;
import com.privod.platform.modules.integration.domain.IntegrationEndpoint;
import com.privod.platform.modules.integration.domain.IntegrationProvider;
import com.privod.platform.modules.integration.repository.IntegrationEndpointRepository;
import com.privod.platform.modules.integration.service.IntegrationEndpointService;
import com.privod.platform.modules.integration.web.dto.ConnectionTestResponse;
import com.privod.platform.modules.integration.web.dto.CreateIntegrationEndpointRequest;
import com.privod.platform.modules.integration.web.dto.IntegrationEndpointResponse;
import com.privod.platform.modules.integration.web.dto.UpdateIntegrationEndpointRequest;
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
class IntegrationEndpointServiceTest {

    @Mock
    private IntegrationEndpointRepository endpointRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private IntegrationEndpointService endpointService;

    private UUID endpointId;
    private IntegrationEndpoint testEndpoint;

    @BeforeEach
    void setUp() {
        endpointId = UUID.randomUUID();
        testEndpoint = IntegrationEndpoint.builder()
                .code("1C-PROD")
                .name("1С Продакшен")
                .provider(IntegrationProvider.ONE_C)
                .baseUrl("https://1c.example.com/api")
                .authType(AuthType.BASIC)
                .isActive(true)
                .healthStatus(HealthStatus.DOWN)
                .rateLimitPerMinute(60)
                .timeoutMs(30000)
                .build();
        testEndpoint.setId(endpointId);
        testEndpoint.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Создание точки интеграции")
    class CreateEndpointTests {

        @Test
        @DisplayName("Должна создать точку интеграции с корректными данными")
        void create_Success() {
            CreateIntegrationEndpointRequest request = new CreateIntegrationEndpointRequest(
                    "1C-PROD", "1С Продакшен", IntegrationProvider.ONE_C,
                    "https://1c.example.com/api", AuthType.BASIC,
                    "{\"username\":\"admin\"}", true, 60, 30000
            );

            when(endpointRepository.existsByCodeAndDeletedFalse("1C-PROD")).thenReturn(false);
            when(endpointRepository.save(any(IntegrationEndpoint.class))).thenAnswer(inv -> {
                IntegrationEndpoint e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            IntegrationEndpointResponse response = endpointService.create(request);

            assertThat(response.code()).isEqualTo("1C-PROD");
            assertThat(response.name()).isEqualTo("1С Продакшен");
            assertThat(response.provider()).isEqualTo(IntegrationProvider.ONE_C);
            assertThat(response.providerDisplayName()).isEqualTo("1С");
            assertThat(response.authType()).isEqualTo(AuthType.BASIC);
            assertThat(response.healthStatus()).isEqualTo(HealthStatus.DOWN);
            verify(auditService).logCreate(eq("IntegrationEndpoint"), any(UUID.class));
        }

        @Test
        @DisplayName("Должна выбросить ошибку при дублировании кода")
        void create_DuplicateCode() {
            CreateIntegrationEndpointRequest request = new CreateIntegrationEndpointRequest(
                    "1C-PROD", "1С Продакшен", IntegrationProvider.ONE_C,
                    "https://1c.example.com/api", AuthType.BASIC,
                    null, null, null, null
            );

            when(endpointRepository.existsByCodeAndDeletedFalse("1C-PROD")).thenReturn(true);

            assertThatThrownBy(() -> endpointService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Обновление точки интеграции")
    class UpdateEndpointTests {

        @Test
        @DisplayName("Должна обновить название и URL")
        void update_Success() {
            when(endpointRepository.findById(endpointId)).thenReturn(Optional.of(testEndpoint));
            when(endpointRepository.save(any(IntegrationEndpoint.class))).thenReturn(testEndpoint);

            UpdateIntegrationEndpointRequest request = new UpdateIntegrationEndpointRequest(
                    "1С Тест", null, "https://test.1c.com/api", null, null, null, null, null
            );

            IntegrationEndpointResponse response = endpointService.update(endpointId, request);

            assertThat(response).isNotNull();
            verify(endpointRepository).save(any(IntegrationEndpoint.class));
            verify(auditService).logUpdate("IntegrationEndpoint", endpointId, "multiple", null, null);
        }

        @Test
        @DisplayName("Должна выбросить ошибку если endpoint не найден")
        void update_NotFound() {
            when(endpointRepository.findById(endpointId)).thenReturn(Optional.empty());

            UpdateIntegrationEndpointRequest request = new UpdateIntegrationEndpointRequest(
                    "Новое имя", null, null, null, null, null, null, null
            );

            assertThatThrownBy(() -> endpointService.update(endpointId, request))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Тест соединения")
    class ConnectionTestTests {

        @Test
        @DisplayName("Должна вернуть HEALTHY для доступного endpoint")
        void testConnection_Healthy() {
            when(endpointRepository.findById(endpointId)).thenReturn(Optional.of(testEndpoint));
            when(endpointRepository.save(any(IntegrationEndpoint.class))).thenReturn(testEndpoint);

            ConnectionTestResponse response = endpointService.testConnection(endpointId);

            assertThat(response.success()).isTrue();
            assertThat(response.healthStatus()).isEqualTo(HealthStatus.HEALTHY);
            assertThat(response.healthStatusDisplayName()).isEqualTo("Работает");
            assertThat(response.responseTimeMs()).isGreaterThanOrEqualTo(0);
        }
    }

    @Test
    @DisplayName("Должна мягко удалить endpoint")
    void delete_SoftDeletes() {
        when(endpointRepository.findById(endpointId)).thenReturn(Optional.of(testEndpoint));
        when(endpointRepository.save(any(IntegrationEndpoint.class))).thenReturn(testEndpoint);

        endpointService.delete(endpointId);

        assertThat(testEndpoint.isDeleted()).isTrue();
        verify(endpointRepository).save(testEndpoint);
        verify(auditService).logDelete("IntegrationEndpoint", endpointId);
    }

    @Test
    @DisplayName("Должна найти endpoint по ID")
    void findById_Success() {
        when(endpointRepository.findById(endpointId)).thenReturn(Optional.of(testEndpoint));

        IntegrationEndpointResponse response = endpointService.findById(endpointId);

        assertThat(response.code()).isEqualTo("1C-PROD");
        assertThat(response.provider()).isEqualTo(IntegrationProvider.ONE_C);
    }
}
