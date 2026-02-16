package com.privod.platform.modules.dataExchange.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.dataExchange.domain.ImportJob;
import com.privod.platform.modules.dataExchange.domain.ImportStatus;
import com.privod.platform.modules.dataExchange.repository.ImportJobRepository;
import com.privod.platform.modules.dataExchange.web.dto.CreateImportJobRequest;
import com.privod.platform.modules.dataExchange.web.dto.ImportJobResponse;
import com.privod.platform.modules.dataExchange.web.dto.UpdateImportJobRequest;
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
class ImportJobServiceTest {

    @Mock
    private ImportJobRepository importJobRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ImportJobService importJobService;

    private UUID jobId;
    private UUID projectId;
    private UUID mappingId;
    private UUID startedById;
    private ImportJob testJob;

    @BeforeEach
    void setUp() {
        jobId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        mappingId = UUID.randomUUID();
        startedById = UUID.randomUUID();

        testJob = ImportJob.builder()
                .entityType("WorkOrder")
                .fileName("data.xlsx")
                .fileSize(1024L)
                .status(ImportStatus.PENDING)
                .totalRows(100)
                .processedRows(0)
                .successRows(0)
                .errorRows(0)
                .mappingId(mappingId)
                .startedById(startedById)
                .projectId(projectId)
                .build();
        testJob.setId(jobId);
        testJob.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Import Job")
    class CreateImportJobTests {

        @Test
        @DisplayName("Should create import job with PENDING status")
        void shouldCreateImportJob_whenValidInput() {
            CreateImportJobRequest request = new CreateImportJobRequest(
                    "WorkOrder", "data.xlsx", 1024L, 100, mappingId, startedById, projectId);

            when(importJobRepository.save(any(ImportJob.class))).thenAnswer(inv -> {
                ImportJob job = inv.getArgument(0);
                job.setId(UUID.randomUUID());
                job.setCreatedAt(Instant.now());
                return job;
            });

            ImportJobResponse response = importJobService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(ImportStatus.PENDING);
            assertThat(response.entityType()).isEqualTo("WorkOrder");
            assertThat(response.processedRows()).isEqualTo(0);
            verify(auditService).logCreate(eq("ImportJob"), any(UUID.class));
        }

        @Test
        @DisplayName("Should initialize rows counters to zero on creation")
        void shouldInitializeCountersToZero_whenCreated() {
            CreateImportJobRequest request = new CreateImportJobRequest(
                    "Contract", "contracts.csv", 2048L, 50, mappingId, startedById, projectId);

            when(importJobRepository.save(any(ImportJob.class))).thenAnswer(inv -> {
                ImportJob job = inv.getArgument(0);
                job.setId(UUID.randomUUID());
                job.setCreatedAt(Instant.now());
                return job;
            });

            ImportJobResponse response = importJobService.create(request);

            assertThat(response.processedRows()).isEqualTo(0);
            assertThat(response.successRows()).isEqualTo(0);
            assertThat(response.errorRows()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Find Import Job")
    class FindImportJobTests {

        @Test
        @DisplayName("Should find import job by ID")
        void shouldReturnImportJob_whenExists() {
            when(importJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));

            ImportJobResponse response = importJobService.findById(jobId);

            assertThat(response).isNotNull();
            assertThat(response.entityType()).isEqualTo("WorkOrder");
            assertThat(response.fileName()).isEqualTo("data.xlsx");
        }

        @Test
        @DisplayName("Should throw when import job not found")
        void shouldThrowException_whenImportJobNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(importJobRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> importJobService.findById(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Задача импорта не найдена");
        }

        @Test
        @DisplayName("Should throw when import job is soft deleted")
        void shouldThrowException_whenImportJobIsDeleted() {
            testJob.softDelete();
            when(importJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));

            assertThatThrownBy(() -> importJobService.findById(jobId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Update Import Job")
    class UpdateImportJobTests {

        @Test
        @DisplayName("Should update import job status and set startedAt when IMPORTING")
        void shouldSetStartedAt_whenStatusChangesToImporting() {
            when(importJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));
            when(importJobRepository.save(any(ImportJob.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateImportJobRequest request = new UpdateImportJobRequest(
                    ImportStatus.IMPORTING, null, null, null, null, null);

            ImportJobResponse response = importJobService.update(jobId, request);

            assertThat(response.status()).isEqualTo(ImportStatus.IMPORTING);
            verify(auditService).logStatusChange("ImportJob", jobId, "PENDING", "IMPORTING");
        }

        @Test
        @DisplayName("Should set completedAt when status changes to COMPLETED")
        void shouldSetCompletedAt_whenStatusChangesToCompleted() {
            testJob.setStatus(ImportStatus.IMPORTING);
            when(importJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));
            when(importJobRepository.save(any(ImportJob.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateImportJobRequest request = new UpdateImportJobRequest(
                    ImportStatus.COMPLETED, null, 100, 95, 5, null);

            importJobService.update(jobId, request);

            assertThat(testJob.getCompletedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Cancel Import Job")
    class CancelImportJobTests {

        @Test
        @DisplayName("Should cancel pending import job")
        void shouldCancel_whenPendingStatus() {
            when(importJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));
            when(importJobRepository.save(any(ImportJob.class))).thenAnswer(inv -> inv.getArgument(0));

            ImportJobResponse response = importJobService.cancel(jobId);

            assertThat(response.status()).isEqualTo(ImportStatus.CANCELLED);
            verify(auditService).logStatusChange("ImportJob", jobId, "PENDING", "CANCELLED");
        }

        @Test
        @DisplayName("Should reject cancel when already completed")
        void shouldThrowException_whenCancelCompletedJob() {
            testJob.setStatus(ImportStatus.COMPLETED);
            when(importJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));

            assertThatThrownBy(() -> importJobService.cancel(jobId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отменить задачу импорта");
        }

        @Test
        @DisplayName("Should reject cancel when already cancelled")
        void shouldThrowException_whenCancelAlreadyCancelledJob() {
            testJob.setStatus(ImportStatus.CANCELLED);
            when(importJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));

            assertThatThrownBy(() -> importJobService.cancel(jobId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отменить задачу импорта");
        }
    }

    @Nested
    @DisplayName("Delete Import Job")
    class DeleteImportJobTests {

        @Test
        @DisplayName("Should soft delete import job")
        void shouldSoftDelete_whenValidId() {
            when(importJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));
            when(importJobRepository.save(any(ImportJob.class))).thenAnswer(inv -> inv.getArgument(0));

            importJobService.delete(jobId);

            assertThat(testJob.isDeleted()).isTrue();
            verify(auditService).logDelete("ImportJob", jobId);
        }
    }
}
