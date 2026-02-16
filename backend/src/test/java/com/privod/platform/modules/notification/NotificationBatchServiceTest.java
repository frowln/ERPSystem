package com.privod.platform.modules.notification;

import com.privod.platform.modules.notification.domain.BatchStatus;
import com.privod.platform.modules.notification.domain.NotificationBatch;
import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.domain.TargetType;
import com.privod.platform.modules.notification.repository.NotificationBatchRepository;
import com.privod.platform.modules.notification.service.NotificationBatchService;
import com.privod.platform.modules.notification.web.dto.CreateBatchRequest;
import com.privod.platform.modules.notification.web.dto.NotificationBatchResponse;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationBatchServiceTest {

    @Mock
    private NotificationBatchRepository batchRepository;

    @InjectMocks
    private NotificationBatchService batchService;

    private UUID batchId;
    private NotificationBatch testBatch;

    @BeforeEach
    void setUp() {
        batchId = UUID.randomUUID();

        testBatch = NotificationBatch.builder()
                .title("Плановое обслуживание системы")
                .message("Система будет недоступна с 23:00 до 01:00")
                .notificationType(NotificationType.SYSTEM)
                .targetType(TargetType.ALL_USERS)
                .targetFilter(new HashMap<>())
                .createdById(UUID.randomUUID())
                .status(BatchStatus.PENDING)
                .sentCount(0)
                .build();
        testBatch.setId(batchId);
        testBatch.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Batch")
    class CreateTests {

        @Test
        @DisplayName("Should create batch with PENDING status")
        void createBatch_Success() {
            CreateBatchRequest request = new CreateBatchRequest(
                    "Обновление регламентов",
                    "Новые регламенты безопасности вступают в силу с 01.07.2025",
                    NotificationType.INFO,
                    TargetType.ROLE,
                    Map.of("role", "FOREMAN"),
                    UUID.randomUUID()
            );

            when(batchRepository.save(any(NotificationBatch.class))).thenAnswer(inv -> {
                NotificationBatch batch = inv.getArgument(0);
                batch.setId(UUID.randomUUID());
                batch.setCreatedAt(Instant.now());
                return batch;
            });

            NotificationBatchResponse response = batchService.createBatch(request);

            assertThat(response.status()).isEqualTo(BatchStatus.PENDING);
            assertThat(response.notificationType()).isEqualTo(NotificationType.INFO);
            assertThat(response.targetType()).isEqualTo(TargetType.ROLE);
            assertThat(response.sentCount()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Send Batch")
    class SendTests {

        @Test
        @DisplayName("Should send pending batch")
        void sendBatch_Success() {
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(testBatch));
            when(batchRepository.save(any(NotificationBatch.class))).thenAnswer(inv -> inv.getArgument(0));

            NotificationBatchResponse response = batchService.sendBatch(batchId);

            assertThat(response.status()).isEqualTo(BatchStatus.SENT);
        }

        @Test
        @DisplayName("Should reject sending already sent batch")
        void sendBatch_AlreadySent() {
            testBatch.setStatus(BatchStatus.SENT);
            when(batchRepository.findById(batchId)).thenReturn(Optional.of(testBatch));

            assertThatThrownBy(() -> batchService.sendBatch(batchId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отправить пакет уведомлений");
        }
    }

    @Nested
    @DisplayName("Get Batch")
    class GetTests {

        @Test
        @DisplayName("Should throw when batch not found")
        void getBatch_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(batchRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> batchService.getBatch(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Пакет уведомлений не найден");
        }
    }
}
