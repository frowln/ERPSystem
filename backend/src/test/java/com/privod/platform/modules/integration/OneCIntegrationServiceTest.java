package com.privod.platform.modules.integration;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.OneCConfig;
import com.privod.platform.modules.integration.domain.OneCExchangeLog;
import com.privod.platform.modules.integration.domain.OneCExchangeStatus;
import com.privod.platform.modules.integration.domain.OneCExchangeType;
import com.privod.platform.modules.integration.domain.OneCMapping;
import com.privod.platform.modules.integration.domain.OneCMappingSyncStatus;
import com.privod.platform.modules.integration.domain.SyncDirection;
import com.privod.platform.modules.integration.repository.OneCConfigRepository;
import com.privod.platform.modules.integration.repository.OneCExchangeLogRepository;
import com.privod.platform.modules.integration.repository.OneCMappingRepository;
import com.privod.platform.modules.integration.service.IntegrationEndpointService;
import com.privod.platform.modules.integration.service.OneCIntegrationService;
import com.privod.platform.modules.integration.service.SyncService;
import com.privod.platform.modules.integration.web.dto.CreateOneCConfigRequest;
import com.privod.platform.modules.integration.web.dto.OneCConfigResponse;
import com.privod.platform.modules.integration.web.dto.OneCExchangeLogResponse;
import com.privod.platform.modules.integration.web.dto.OneCMappingResponse;
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
class OneCIntegrationServiceTest {

    @Mock
    private SyncService syncService;

    @Mock
    private IntegrationEndpointService endpointService;

    @Mock
    private OneCConfigRepository configRepository;

    @Mock
    private OneCExchangeLogRepository exchangeLogRepository;

    @Mock
    private OneCMappingRepository mappingRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OneCIntegrationService oneCIntegrationService;

    private UUID configId;
    private UUID exchangeLogId;
    private UUID mappingId;
    private OneCConfig testConfig;
    private OneCExchangeLog testExchangeLog;
    private OneCMapping testMapping;

    @BeforeEach
    void setUp() {
        configId = UUID.randomUUID();
        exchangeLogId = UUID.randomUUID();
        mappingId = UUID.randomUUID();

        testConfig = OneCConfig.builder()
                .name("1C Бухгалтерия")
                .baseUrl("http://localhost:8080/1c")
                .username("admin")
                .password("secret")
                .databaseName("accounting_db")
                .syncDirection(SyncDirection.BIDIRECTIONAL)
                .syncIntervalMinutes(30)
                .isActive(true)
                .build();
        testConfig.setId(configId);
        testConfig.setCreatedAt(Instant.now());

        testExchangeLog = OneCExchangeLog.builder()
                .configId(configId)
                .exchangeType(OneCExchangeType.FULL)
                .direction(SyncDirection.BIDIRECTIONAL)
                .status(OneCExchangeStatus.STARTED)
                .startedAt(Instant.now())
                .build();
        testExchangeLog.setId(exchangeLogId);
        testExchangeLog.setCreatedAt(Instant.now());

        testMapping = OneCMapping.builder()
                .entityType("contractor")
                .privodId(UUID.randomUUID())
                .oneCId("00000001")
                .oneCCode("КА-001")
                .syncStatus(OneCMappingSyncStatus.SYNCED)
                .lastSyncAt(Instant.now())
                .build();
        testMapping.setId(mappingId);
        testMapping.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Config")
    class CreateConfigTests {

        @Test
        @DisplayName("Should create config with isActive = true")
        void createConfig_SetsActiveTrue() {
            CreateOneCConfigRequest request = new CreateOneCConfigRequest(
                    "1C Зарплата", "http://localhost:8080/1c-zp", "admin", "pass",
                    "salary_db", SyncDirection.IMPORT, 60
            );

            when(configRepository.existsByNameAndDeletedFalse("1C Зарплата")).thenReturn(false);
            when(configRepository.save(any(OneCConfig.class))).thenAnswer(inv -> {
                OneCConfig config = inv.getArgument(0);
                config.setId(UUID.randomUUID());
                config.setCreatedAt(Instant.now());
                return config;
            });

            OneCConfigResponse response = oneCIntegrationService.createConfig(request);

            assertThat(response.isActive()).isTrue();
            assertThat(response.name()).isEqualTo("1C Зарплата");
            assertThat(response.syncDirection()).isEqualTo(SyncDirection.IMPORT);
            assertThat(response.syncIntervalMinutes()).isEqualTo(60);
            verify(auditService).logCreate(eq("OneCConfig"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when config with same name exists")
        void createConfig_DuplicateName_Throws() {
            CreateOneCConfigRequest request = new CreateOneCConfigRequest(
                    "1C Бухгалтерия", "http://localhost:8080/1c", "admin", "pass",
                    "db", SyncDirection.BIDIRECTIONAL, 30
            );

            when(configRepository.existsByNameAndDeletedFalse("1C Бухгалтерия")).thenReturn(true);

            assertThatThrownBy(() -> oneCIntegrationService.createConfig(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Start Exchange")
    class StartExchangeTests {

        @Test
        @DisplayName("Should start exchange with STARTED status and given direction")
        void startExchange_CreatesLogWithStartedStatus() {
            when(configRepository.findById(configId)).thenReturn(Optional.of(testConfig));
            when(exchangeLogRepository.save(any(OneCExchangeLog.class))).thenAnswer(inv -> {
                OneCExchangeLog log = inv.getArgument(0);
                log.setId(UUID.randomUUID());
                log.setCreatedAt(Instant.now());
                return log;
            });

            OneCExchangeLogResponse response = oneCIntegrationService.startExchange(
                    configId, OneCExchangeType.FULL, SyncDirection.IMPORT);

            assertThat(response.status()).isEqualTo(OneCExchangeStatus.STARTED);
            assertThat(response.exchangeType()).isEqualTo(OneCExchangeType.FULL);
            assertThat(response.direction()).isEqualTo(SyncDirection.IMPORT);
            assertThat(response.startedAt()).isNotNull();
            verify(auditService).logCreate(eq("OneCExchangeLog"), any(UUID.class));
        }

        @Test
        @DisplayName("Should use config direction when direction is null")
        void startExchange_NullDirection_UsesConfigDirection() {
            when(configRepository.findById(configId)).thenReturn(Optional.of(testConfig));
            when(exchangeLogRepository.save(any(OneCExchangeLog.class))).thenAnswer(inv -> {
                OneCExchangeLog log = inv.getArgument(0);
                log.setId(UUID.randomUUID());
                log.setCreatedAt(Instant.now());
                return log;
            });

            OneCExchangeLogResponse response = oneCIntegrationService.startExchange(
                    configId, OneCExchangeType.INCREMENTAL, null);

            assertThat(response.direction()).isEqualTo(SyncDirection.BIDIRECTIONAL);
        }
    }

    @Nested
    @DisplayName("Complete Exchange")
    class CompleteExchangeTests {

        @Test
        @DisplayName("Should complete exchange with COMPLETED status when records processed")
        void completeExchange_WithProcessedRecords() {
            when(exchangeLogRepository.findById(exchangeLogId)).thenReturn(Optional.of(testExchangeLog));
            when(exchangeLogRepository.save(any(OneCExchangeLog.class))).thenAnswer(inv -> inv.getArgument(0));
            when(configRepository.findById(configId)).thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(OneCConfig.class))).thenAnswer(inv -> inv.getArgument(0));

            OneCExchangeLogResponse response = oneCIntegrationService.completeExchange(
                    exchangeLogId, 100, 2, null);

            assertThat(response.status()).isEqualTo(OneCExchangeStatus.COMPLETED);
            assertThat(response.recordsProcessed()).isEqualTo(100);
            assertThat(response.recordsFailed()).isEqualTo(2);
            assertThat(response.completedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should set FAILED status when all records failed")
        void completeExchange_AllFailed_SetsFailed() {
            when(exchangeLogRepository.findById(exchangeLogId)).thenReturn(Optional.of(testExchangeLog));
            when(exchangeLogRepository.save(any(OneCExchangeLog.class))).thenAnswer(inv -> inv.getArgument(0));
            when(configRepository.findById(configId)).thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(OneCConfig.class))).thenAnswer(inv -> inv.getArgument(0));

            OneCExchangeLogResponse response = oneCIntegrationService.completeExchange(
                    exchangeLogId, 0, 5, "Connection timeout");

            assertThat(response.status()).isEqualTo(OneCExchangeStatus.FAILED);
            assertThat(response.errorMessage()).isEqualTo("Connection timeout");
        }
    }

    @Nested
    @DisplayName("Create Mapping")
    class CreateMappingTests {

        @Test
        @DisplayName("Should create mapping with SYNCED status")
        void createMapping_Success() {
            UUID privodId = UUID.randomUUID();
            when(mappingRepository.findByPrivodIdAndEntityTypeAndDeletedFalse(privodId, "contractor"))
                    .thenReturn(Optional.empty());
            when(mappingRepository.save(any(OneCMapping.class))).thenAnswer(inv -> {
                OneCMapping m = inv.getArgument(0);
                m.setId(UUID.randomUUID());
                m.setCreatedAt(Instant.now());
                return m;
            });

            OneCMappingResponse response = oneCIntegrationService.createMapping(
                    "contractor", privodId, "00000002", "КА-002");

            assertThat(response.entityType()).isEqualTo("contractor");
            assertThat(response.privodId()).isEqualTo(privodId);
            assertThat(response.oneCId()).isEqualTo("00000002");
            assertThat(response.syncStatus()).isEqualTo(OneCMappingSyncStatus.SYNCED);
            verify(auditService).logCreate(eq("OneCMapping"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when mapping already exists for entity")
        void createMapping_Duplicate_Throws() {
            UUID privodId = testMapping.getPrivodId();
            when(mappingRepository.findByPrivodIdAndEntityTypeAndDeletedFalse(privodId, "contractor"))
                    .thenReturn(Optional.of(testMapping));

            assertThatThrownBy(() -> oneCIntegrationService.createMapping(
                    "contractor", privodId, "00000003", "КА-003"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Update Mapping Status")
    class UpdateMappingStatusTests {

        @Test
        @DisplayName("Should update mapping status and set conflict data")
        void updateMappingStatus_WithConflictData() {
            when(mappingRepository.findById(mappingId)).thenReturn(Optional.of(testMapping));
            when(mappingRepository.save(any(OneCMapping.class))).thenAnswer(inv -> inv.getArgument(0));

            OneCMappingResponse response = oneCIntegrationService.updateMappingStatus(
                    mappingId, OneCMappingSyncStatus.CONFLICT, "{\"field\":\"name\"}");

            assertThat(response.syncStatus()).isEqualTo(OneCMappingSyncStatus.CONFLICT);
            assertThat(response.conflictData()).isEqualTo("{\"field\":\"name\"}");
            verify(auditService).logStatusChange("OneCMapping", mappingId, "SYNCED", "CONFLICT");
        }
    }

    @Nested
    @DisplayName("Toggle Active")
    class ToggleActiveTests {

        @Test
        @DisplayName("Should toggle active config to inactive")
        void toggleActive_ActiveToInactive() {
            when(configRepository.findById(configId)).thenReturn(Optional.of(testConfig));
            when(configRepository.save(any(OneCConfig.class))).thenAnswer(inv -> inv.getArgument(0));

            OneCConfigResponse response = oneCIntegrationService.toggleActive(configId);

            assertThat(response.isActive()).isFalse();
            verify(auditService).logUpdate("OneCConfig", configId, "isActive", "true", "false");
        }

        @Test
        @DisplayName("Should throw when config not found")
        void toggleActive_NotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            when(configRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> oneCIntegrationService.toggleActive(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Конфигурация 1С не найдена");
        }
    }
}
