package com.privod.platform.modules.dataExchange.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.dataExchange.domain.ExportFormat;
import com.privod.platform.modules.dataExchange.domain.ExportJob;
import com.privod.platform.modules.dataExchange.repository.ExportJobRepository;
import com.privod.platform.modules.dataExchange.web.dto.CreateExportJobRequest;
import com.privod.platform.modules.dataExchange.web.dto.ExportJobResponse;
import com.privod.platform.modules.dataExchange.web.dto.UpdateExportJobRequest;
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
class ExportJobServiceTest {

    @Mock
    private ExportJobRepository exportJobRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ExportJobService exportJobService;

    private UUID jobId;
    private UUID projectId;
    private UUID requestedById;
    private ExportJob testJob;

    @BeforeEach
    void setUp() {
        jobId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        requestedById = UUID.randomUUID();

        testJob = ExportJob.builder()
                .entityType("Contract")
                .format(ExportFormat.XLSX)
                .fileName("contracts_export.xlsx")
                .filters("{}")
                .status("PENDING")
                .startedAt(Instant.now())
                .requestedById(requestedById)
                .projectId(projectId)
                .build();
        testJob.setId(jobId);
        testJob.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Export Job")
    class CreateExportJobTests {

        @Test
        @DisplayName("Should create export job with PENDING status")
        void shouldCreateExportJob_whenValidInput() {
            CreateExportJobRequest request = new CreateExportJobRequest(
                    "Contract", ExportFormat.XLSX, "contracts.xlsx", "{}", requestedById, projectId);

            when(exportJobRepository.save(any(ExportJob.class))).thenAnswer(inv -> {
                ExportJob job = inv.getArgument(0);
                job.setId(UUID.randomUUID());
                job.setCreatedAt(Instant.now());
                return job;
            });

            ExportJobResponse response = exportJobService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo("PENDING");
            assertThat(response.entityType()).isEqualTo("Contract");
            assertThat(response.format()).isEqualTo(ExportFormat.XLSX);
            verify(auditService).logCreate(eq("ExportJob"), any(UUID.class));
        }

        @Test
        @DisplayName("Should set startedAt on creation")
        void shouldSetStartedAt_whenCreated() {
            CreateExportJobRequest request = new CreateExportJobRequest(
                    "WorkOrder", ExportFormat.CSV, "workorders.csv", null, requestedById, projectId);

            when(exportJobRepository.save(any(ExportJob.class))).thenAnswer(inv -> {
                ExportJob job = inv.getArgument(0);
                job.setId(UUID.randomUUID());
                job.setCreatedAt(Instant.now());
                return job;
            });

            ExportJobResponse response = exportJobService.create(request);

            assertThat(response.startedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Find Export Job")
    class FindExportJobTests {

        @Test
        @DisplayName("Should find export job by ID")
        void shouldReturnExportJob_whenExists() {
            when(exportJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));

            ExportJobResponse response = exportJobService.findById(jobId);

            assertThat(response).isNotNull();
            assertThat(response.entityType()).isEqualTo("Contract");
            assertThat(response.format()).isEqualTo(ExportFormat.XLSX);
        }

        @Test
        @DisplayName("Should throw when export job not found")
        void shouldThrowException_whenExportJobNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(exportJobRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> exportJobService.findById(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Задача экспорта не найдена");
        }

        @Test
        @DisplayName("Should throw when export job is soft deleted")
        void shouldThrowException_whenExportJobIsDeleted() {
            testJob.softDelete();
            when(exportJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));

            assertThatThrownBy(() -> exportJobService.findById(jobId))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Update Export Job")
    class UpdateExportJobTests {

        @Test
        @DisplayName("Should update export job status")
        void shouldUpdateStatus_whenValidInput() {
            when(exportJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));
            when(exportJobRepository.save(any(ExportJob.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateExportJobRequest request = new UpdateExportJobRequest("COMPLETED", 150, "/files/export.xlsx");

            ExportJobResponse response = exportJobService.update(jobId, request);

            assertThat(response.status()).isEqualTo("COMPLETED");
            assertThat(response.totalRows()).isEqualTo(150);
            verify(auditService).logStatusChange("ExportJob", jobId, "PENDING", "COMPLETED");
        }

        @Test
        @DisplayName("Should set completedAt when status changes to COMPLETED")
        void shouldSetCompletedAt_whenStatusCompleted() {
            when(exportJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));
            when(exportJobRepository.save(any(ExportJob.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateExportJobRequest request = new UpdateExportJobRequest("COMPLETED", null, null);

            exportJobService.update(jobId, request);

            assertThat(testJob.getCompletedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should set completedAt when status changes to FAILED")
        void shouldSetCompletedAt_whenStatusFailed() {
            when(exportJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));
            when(exportJobRepository.save(any(ExportJob.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateExportJobRequest request = new UpdateExportJobRequest("FAILED", null, null);

            exportJobService.update(jobId, request);

            assertThat(testJob.getCompletedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Delete Export Job")
    class DeleteExportJobTests {

        @Test
        @DisplayName("Should soft delete export job")
        void shouldSoftDelete_whenValidId() {
            when(exportJobRepository.findById(jobId)).thenReturn(Optional.of(testJob));
            when(exportJobRepository.save(any(ExportJob.class))).thenAnswer(inv -> inv.getArgument(0));

            exportJobService.delete(jobId);

            assertThat(testJob.isDeleted()).isTrue();
            verify(auditService).logDelete("ExportJob", jobId);
        }

        @Test
        @DisplayName("Should throw when deleting non-existent export job")
        void shouldThrowException_whenDeleteNonExistent() {
            UUID nonExistent = UUID.randomUUID();
            when(exportJobRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> exportJobService.delete(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }
}
