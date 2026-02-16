package com.privod.platform.modules.russianDoc;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.russianDoc.domain.OcrTask;
import com.privod.platform.modules.russianDoc.domain.OcrTaskStatus;
import com.privod.platform.modules.russianDoc.repository.OcrTaskRepository;
import com.privod.platform.modules.russianDoc.repository.OcrTemplateRepository;
import com.privod.platform.modules.russianDoc.service.OcrService;
import com.privod.platform.modules.russianDoc.web.dto.CreateOcrTaskRequest;
import com.privod.platform.modules.russianDoc.web.dto.OcrTaskResponse;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OcrServiceTest {

    @Mock
    private OcrTaskRepository taskRepository;
    @Mock
    private OcrTemplateRepository templateRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private OcrService ocrService;

    private UUID taskId;
    private OcrTask testTask;

    @BeforeEach
    void setUp() {
        taskId = UUID.randomUUID();

        testTask = OcrTask.builder()
                .fileUrl("https://storage.example.com/docs/invoice_001.pdf")
                .fileName("invoice_001.pdf")
                .status(OcrTaskStatus.PENDING)
                .projectId(UUID.randomUUID())
                .build();
        testTask.setId(taskId);
        testTask.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create OCR Task")
    class CreateTaskTests {

        @Test
        @DisplayName("Should create OCR task with PENDING status")
        void createTask_SetsPendingStatus() {
            CreateOcrTaskRequest request = new CreateOcrTaskRequest(
                    "https://storage.example.com/docs/torg12.pdf",
                    "torg12.pdf", null, UUID.randomUUID());

            when(taskRepository.save(any(OcrTask.class))).thenAnswer(inv -> {
                OcrTask t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                t.setCreatedAt(Instant.now());
                return t;
            });

            OcrTaskResponse response = ocrService.createTask(request);

            assertThat(response.status()).isEqualTo(OcrTaskStatus.PENDING);
            assertThat(response.fileName()).isEqualTo("torg12.pdf");
            verify(auditService).logCreate(eq("OcrTask"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Start Processing")
    class StartProcessingTests {

        @Test
        @DisplayName("Should start processing PENDING task")
        void startProcessing_ChangesToProcessing() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(OcrTask.class))).thenAnswer(inv -> inv.getArgument(0));

            OcrTaskResponse response = ocrService.startProcessing(taskId);

            assertThat(response.status()).isEqualTo(OcrTaskStatus.PROCESSING);
            verify(auditService).logStatusChange("OcrTask", taskId, "PENDING", "PROCESSING");
        }

        @Test
        @DisplayName("Should throw when starting non-PENDING task")
        void startProcessing_ThrowsForNonPending() {
            testTask.setStatus(OcrTaskStatus.COMPLETED);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

            assertThatThrownBy(() -> ocrService.startProcessing(taskId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("PENDING");
        }
    }

    @Nested
    @DisplayName("Complete Task")
    class CompleteTaskTests {

        @Test
        @DisplayName("Should complete PROCESSING task with OCR results")
        void completeTask_WithResults() {
            testTask.setStatus(OcrTaskStatus.PROCESSING);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(OcrTask.class))).thenAnswer(inv -> inv.getArgument(0));

            OcrTaskResponse response = ocrService.completeTask(
                    taskId,
                    "Распознанный текст ТОРГ-12",
                    "{\"number\":\"ТН-001\",\"date\":\"2025-01-15\"}",
                    0.95);

            assertThat(response.status()).isEqualTo(OcrTaskStatus.COMPLETED);
            assertThat(response.confidence()).isEqualTo(0.95);
            assertThat(response.recognizedText()).isEqualTo("Распознанный текст ТОРГ-12");
        }

        @Test
        @DisplayName("Should throw when completing non-PROCESSING task")
        void completeTask_ThrowsForNonProcessing() {
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));

            assertThatThrownBy(() -> ocrService.completeTask(taskId, "text", "{}", 0.5))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("PROCESSING");
        }
    }

    @Nested
    @DisplayName("Fail Task")
    class FailTaskTests {

        @Test
        @DisplayName("Should mark task as FAILED with error message")
        void failTask_SetsFailedStatus() {
            testTask.setStatus(OcrTaskStatus.PROCESSING);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(testTask));
            when(taskRepository.save(any(OcrTask.class))).thenAnswer(inv -> inv.getArgument(0));

            OcrTaskResponse response = ocrService.failTask(taskId, "Нечитаемый документ");

            assertThat(response.status()).isEqualTo(OcrTaskStatus.FAILED);
            assertThat(response.recognizedText()).isEqualTo("Нечитаемый документ");
            assertThat(response.processedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Get Pending Tasks")
    class GetPendingTasksTests {

        @Test
        @DisplayName("Should return only PENDING tasks")
        void getPendingTasks_ReturnsPending() {
            when(taskRepository.findByStatusAndDeletedFalse(OcrTaskStatus.PENDING))
                    .thenReturn(List.of(testTask));

            List<OcrTaskResponse> result = ocrService.getPendingTasks();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).status()).isEqualTo(OcrTaskStatus.PENDING);
        }
    }

    @Nested
    @DisplayName("Get Task")
    class GetTaskTests {

        @Test
        @DisplayName("Should throw for non-existing task")
        void getTask_ThrowsForNonExisting() {
            UUID nonExistingId = UUID.randomUUID();
            when(taskRepository.findById(nonExistingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> ocrService.getTask(nonExistingId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("OCR задача не найдена");
        }
    }
}
