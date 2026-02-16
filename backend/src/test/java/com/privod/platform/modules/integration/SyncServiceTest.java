package com.privod.platform.modules.integration;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.domain.IntegrationEndpoint;
import com.privod.platform.modules.integration.domain.IntegrationProvider;
import com.privod.platform.modules.integration.domain.AuthType;
import com.privod.platform.modules.integration.domain.HealthStatus;
import com.privod.platform.modules.integration.domain.SyncDirection;
import com.privod.platform.modules.integration.domain.SyncJob;
import com.privod.platform.modules.integration.domain.SyncJobStatus;
import com.privod.platform.modules.integration.domain.SyncType;
import com.privod.platform.modules.integration.repository.SyncJobRepository;
import com.privod.platform.modules.integration.service.IntegrationEndpointService;
import com.privod.platform.modules.integration.service.SyncService;
import com.privod.platform.modules.integration.web.dto.StartSyncRequest;
import com.privod.platform.modules.integration.web.dto.SyncJobResponse;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

    @Mock
    private SyncJobRepository syncJobRepository;

    @Mock
    private IntegrationEndpointService endpointService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SyncService syncService;

    private UUID endpointId;
    private UUID syncJobId;
    private IntegrationEndpoint testEndpoint;
    private SyncJob testSyncJob;

    @BeforeEach
    void setUp() {
        endpointId = UUID.randomUUID();
        syncJobId = UUID.randomUUID();

        testEndpoint = IntegrationEndpoint.builder()
                .code("1C-PROD")
                .name("1С Продакшен")
                .provider(IntegrationProvider.ONE_C)
                .baseUrl("https://1c.example.com/api")
                .authType(AuthType.BASIC)
                .isActive(true)
                .healthStatus(HealthStatus.HEALTHY)
                .build();
        testEndpoint.setId(endpointId);

        testSyncJob = SyncJob.builder()
                .code("SYNC-00001")
                .endpointId(endpointId)
                .syncType(SyncType.INCREMENTAL)
                .direction(SyncDirection.IMPORT)
                .entityType("invoice")
                .status(SyncJobStatus.RUNNING)
                .startedAt(Instant.now())
                .build();
        testSyncJob.setId(syncJobId);
        testSyncJob.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Запуск синхронизации")
    class StartSyncTests {

        @Test
        @DisplayName("Должна создать и запустить задание синхронизации")
        void startSync_Success() {
            when(endpointService.getEndpointOrThrow(endpointId)).thenReturn(testEndpoint);
            when(syncJobRepository.getNextCodeSequence()).thenReturn(1L);
            when(syncJobRepository.save(any(SyncJob.class))).thenAnswer(inv -> {
                SyncJob j = inv.getArgument(0);
                if (j.getId() == null) {
                    j.setId(UUID.randomUUID());
                    j.setCreatedAt(Instant.now());
                }
                return j;
            });

            StartSyncRequest request = new StartSyncRequest(
                    endpointId, SyncType.INCREMENTAL, SyncDirection.IMPORT, "invoice"
            );

            SyncJobResponse response = syncService.startSync(request);

            assertThat(response.code()).isEqualTo("SYNC-00001");
            assertThat(response.entityType()).isEqualTo("invoice");
            assertThat(response.status()).isEqualTo(SyncJobStatus.RUNNING);
            assertThat(response.statusDisplayName()).isEqualTo("Выполняется");
            assertThat(response.startedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Отмена синхронизации")
    class CancelSyncTests {

        @Test
        @DisplayName("Должна отменить выполняющееся задание")
        void cancelSync_Running() {
            when(syncJobRepository.findById(syncJobId)).thenReturn(Optional.of(testSyncJob));
            when(syncJobRepository.save(any(SyncJob.class))).thenReturn(testSyncJob);

            SyncJobResponse response = syncService.cancelSync(syncJobId);

            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("Должна выбросить ошибку для завершённого задания")
        void cancelSync_Completed() {
            testSyncJob.setStatus(SyncJobStatus.COMPLETED);
            when(syncJobRepository.findById(syncJobId)).thenReturn(Optional.of(testSyncJob));

            assertThatThrownBy(() -> syncService.cancelSync(syncJobId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отменить");
        }
    }

    @Test
    @DisplayName("Должна повторить неудачную синхронизацию")
    void retryFailed_Success() {
        testSyncJob.setStatus(SyncJobStatus.FAILED);
        testSyncJob.setErrorCount(5);
        testSyncJob.setErrorLog("[{\"error\":\"timeout\"}]");

        when(syncJobRepository.findById(syncJobId)).thenReturn(Optional.of(testSyncJob));
        when(syncJobRepository.save(any(SyncJob.class))).thenAnswer(inv -> inv.getArgument(0));

        SyncJobResponse response = syncService.retryFailed(syncJobId);

        assertThat(response.status()).isEqualTo(SyncJobStatus.RUNNING);
        assertThat(response.startedAt()).isNotNull();
    }

    @Test
    @DisplayName("Должна выбросить ошибку при повторе не-FAILED задания")
    void retryFailed_NotFailed() {
        testSyncJob.setStatus(SyncJobStatus.RUNNING);
        when(syncJobRepository.findById(syncJobId)).thenReturn(Optional.of(testSyncJob));

        assertThatThrownBy(() -> syncService.retryFailed(syncJobId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Ошибка");
    }

    @Test
    @DisplayName("Должна выбросить ошибку если задание не найдено")
    void findById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(syncJobRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> syncService.findById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
