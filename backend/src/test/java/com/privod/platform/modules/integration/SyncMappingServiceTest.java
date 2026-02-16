package com.privod.platform.modules.integration;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.IntegrationEndpoint;
import com.privod.platform.modules.integration.domain.IntegrationProvider;
import com.privod.platform.modules.integration.domain.AuthType;
import com.privod.platform.modules.integration.domain.HealthStatus;
import com.privod.platform.modules.integration.domain.MappingDirection;
import com.privod.platform.modules.integration.domain.SyncMapping;
import com.privod.platform.modules.integration.repository.SyncMappingRepository;
import com.privod.platform.modules.integration.service.IntegrationEndpointService;
import com.privod.platform.modules.integration.service.SyncMappingService;
import com.privod.platform.modules.integration.web.dto.CreateSyncMappingRequest;
import com.privod.platform.modules.integration.web.dto.SyncMappingResponse;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SyncMappingServiceTest {

    @Mock
    private SyncMappingRepository syncMappingRepository;

    @Mock
    private IntegrationEndpointService endpointService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SyncMappingService syncMappingService;

    private UUID endpointId;
    private UUID mappingId;
    private IntegrationEndpoint testEndpoint;
    private SyncMapping testMapping;

    @BeforeEach
    void setUp() {
        endpointId = UUID.randomUUID();
        mappingId = UUID.randomUUID();

        testEndpoint = IntegrationEndpoint.builder()
                .code("1C-PROD")
                .name("1С Продакшен")
                .provider(IntegrationProvider.ONE_C)
                .baseUrl("https://1c.example.com/api")
                .authType(AuthType.BASIC)
                .healthStatus(HealthStatus.HEALTHY)
                .build();
        testEndpoint.setId(endpointId);

        testMapping = SyncMapping.builder()
                .endpointId(endpointId)
                .localEntityType("invoice")
                .localFieldName("amount")
                .remoteEntityType("Документ.Счёт")
                .remoteFieldName("Сумма")
                .transformExpression("value * 100")
                .direction(MappingDirection.BOTH)
                .isRequired(true)
                .build();
        testMapping.setId(mappingId);
        testMapping.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Создание маппинга")
    class CreateMappingTests {

        @Test
        @DisplayName("Должен создать маппинг с трансформацией")
        void create_Success() {
            when(endpointService.getEndpointOrThrow(endpointId)).thenReturn(testEndpoint);
            when(syncMappingRepository.save(any(SyncMapping.class))).thenAnswer(inv -> {
                SyncMapping m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            CreateSyncMappingRequest request = new CreateSyncMappingRequest(
                    endpointId, "invoice", "amount",
                    "Документ.Счёт", "Сумма",
                    "value * 100", MappingDirection.BOTH, true
            );

            SyncMappingResponse response = syncMappingService.create(request);

            assertThat(response.localEntityType()).isEqualTo("invoice");
            assertThat(response.localFieldName()).isEqualTo("amount");
            assertThat(response.remoteEntityType()).isEqualTo("Документ.Счёт");
            assertThat(response.transformExpression()).isEqualTo("value * 100");
            assertThat(response.direction()).isEqualTo(MappingDirection.BOTH);
            assertThat(response.directionDisplayName()).isEqualTo("Обе стороны");
            assertThat(response.isRequired()).isTrue();
            verify(auditService).logCreate(eq("SyncMapping"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Применение трансформаций")
    class TransformationTests {

        @Test
        @DisplayName("Должен применить умножение")
        void applyTransformation_Multiply() {
            String result = syncMappingService.applyTransformation("150.5", "value * 100");
            assertThat(result).isEqualTo("15050.0");
        }

        @Test
        @DisplayName("Должен применить toUpperCase")
        void applyTransformation_ToUpperCase() {
            String result = syncMappingService.applyTransformation("hello world", "toUpperCase()");
            assertThat(result).isEqualTo("HELLO WORLD");
        }

        @Test
        @DisplayName("Должен вернуть исходное значение без трансформации")
        void applyTransformation_NoExpression() {
            String result = syncMappingService.applyTransformation("hello", null);
            assertThat(result).isEqualTo("hello");
        }

        @Test
        @DisplayName("Должен вернуть null для null значения")
        void applyTransformation_NullValue() {
            String result = syncMappingService.applyTransformation(null, "toUpperCase()");
            assertThat(result).isNull();
        }
    }

    @Test
    @DisplayName("Должен получить маппинги полей по типу сущности")
    void getFieldMapping_Success() {
        when(syncMappingRepository.findByEndpointIdAndLocalEntityTypeAndDeletedFalse(endpointId, "invoice"))
                .thenReturn(List.of(testMapping));

        List<SyncMappingResponse> responses = syncMappingService.getFieldMapping(endpointId, "invoice");

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).localFieldName()).isEqualTo("amount");
        assertThat(responses.get(0).remoteFieldName()).isEqualTo("Сумма");
    }

    @Test
    @DisplayName("Должен мягко удалить маппинг")
    void delete_SoftDeletes() {
        when(syncMappingRepository.findById(mappingId)).thenReturn(Optional.of(testMapping));
        when(syncMappingRepository.save(any(SyncMapping.class))).thenReturn(testMapping);

        syncMappingService.delete(mappingId);

        assertThat(testMapping.isDeleted()).isTrue();
        verify(auditService).logDelete("SyncMapping", mappingId);
    }
}
