package com.privod.platform.modules.quality.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.CheckResult;
import com.privod.platform.modules.quality.domain.CheckStatus;
import com.privod.platform.modules.quality.domain.QualityCheck;
import com.privod.platform.modules.quality.repository.QualityCheckRepository;
import com.privod.platform.modules.quality.web.dto.CreateQualityCheckRequest;
import com.privod.platform.modules.quality.web.dto.QualityCheckResponse;
import com.privod.platform.modules.quality.web.dto.UpdateQualityCheckRequest;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QualityCheckServiceTest {

    @Mock
    private QualityCheckRepository qualityCheckRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private QualityCheckService qualityCheckService;

    private UUID checkId;
    private UUID projectId;
    private QualityCheck testCheck;

    @BeforeEach
    void setUp() {
        checkId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testCheck = QualityCheck.builder()
                .code("QC-00001")
                .projectId(projectId)
                .checkType("VISUAL")
                .name("Concrete Foundation Check")
                .description("Visual inspection of foundation")
                .plannedDate(LocalDate.of(2025, 6, 15))
                .inspectorName("Ivanov I.I.")
                .result(CheckResult.PENDING)
                .status(CheckStatus.PLANNED)
                .attachmentUrls(new ArrayList<>())
                .build();
        testCheck.setId(checkId);
        testCheck.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Quality Check")
    class CreateTests {

        @Test
        @DisplayName("Should create quality check with PLANNED status and PENDING result")
        void shouldCreate_withPlannedStatusAndPendingResult() {
            CreateQualityCheckRequest request = new CreateQualityCheckRequest(
                    projectId, null, null, "MEASUREMENT",
                    "Steel Structure Check", "Check steel dimensions",
                    LocalDate.of(2025, 7, 1), null, "Petrov P.P.",
                    null);

            when(qualityCheckRepository.getNextNumberSequence()).thenReturn(2L);
            when(qualityCheckRepository.save(any(QualityCheck.class))).thenAnswer(inv -> {
                QualityCheck qc = inv.getArgument(0);
                qc.setId(UUID.randomUUID());
                qc.setCreatedAt(Instant.now());
                return qc;
            });

            QualityCheckResponse response = qualityCheckService.createCheck(request);

            assertThat(response.status()).isEqualTo(CheckStatus.PLANNED);
            assertThat(response.result()).isEqualTo(CheckResult.PENDING);
            assertThat(response.code()).isEqualTo("QC-00002");
            verify(auditService).logCreate(eq("QualityCheck"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Update Quality Check")
    class UpdateTests {

        @Test
        @DisplayName("Should update quality check fields")
        void shouldUpdate_whenValidInput() {
            when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));
            when(qualityCheckRepository.save(any(QualityCheck.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateQualityCheckRequest request = new UpdateQualityCheckRequest(
                    null, null, null, "Updated Check Name",
                    "Updated description", null, null,
                    null, null, null, null,
                    "Found minor defects", "Repeat in 30 days", null);

            QualityCheckResponse response = qualityCheckService.updateCheck(checkId, request);

            assertThat(response.name()).isEqualTo("Updated Check Name");
            verify(auditService).logUpdate(eq("QualityCheck"), eq(checkId), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Quality Check Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should start check from PLANNED")
        void shouldStart_whenPlanned() {
            when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));
            when(qualityCheckRepository.save(any(QualityCheck.class))).thenAnswer(inv -> inv.getArgument(0));

            QualityCheckResponse response = qualityCheckService.startCheck(checkId);

            assertThat(response.status()).isEqualTo(CheckStatus.IN_PROGRESS);
            assertThat(response.actualDate()).isEqualTo(LocalDate.now());
            verify(auditService).logStatusChange("QualityCheck", checkId, "PLANNED", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should reject start when not PLANNED")
        void shouldThrowException_whenStartFromNonPlanned() {
            testCheck.setStatus(CheckStatus.COMPLETED);
            when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));

            assertThatThrownBy(() -> qualityCheckService.startCheck(checkId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно начать проверку");
        }

        @Test
        @DisplayName("Should complete check with result")
        void shouldComplete_whenInProgress() {
            testCheck.setStatus(CheckStatus.IN_PROGRESS);
            when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));
            when(qualityCheckRepository.save(any(QualityCheck.class))).thenAnswer(inv -> inv.getArgument(0));

            QualityCheckResponse response = qualityCheckService.completeCheck(
                    checkId, CheckResult.PASS, "All within tolerance", "No action needed");

            assertThat(response.status()).isEqualTo(CheckStatus.COMPLETED);
            assertThat(response.result()).isEqualTo(CheckResult.PASS);
            verify(auditService).logStatusChange("QualityCheck", checkId, "IN_PROGRESS", "COMPLETED");
        }

        @Test
        @DisplayName("Should reject complete when not IN_PROGRESS")
        void shouldThrowException_whenCompleteFromNonInProgress() {
            when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));

            assertThatThrownBy(() -> qualityCheckService.completeCheck(
                    checkId, CheckResult.FAIL, "Defects found", null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно завершить проверку");
        }
    }

    @Test
    @DisplayName("Should find quality check by ID")
    void shouldReturnCheck_whenExists() {
        when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));

        QualityCheckResponse response = qualityCheckService.getCheck(checkId);

        assertThat(response).isNotNull();
        assertThat(response.code()).isEqualTo("QC-00001");
        assertThat(response.name()).isEqualTo("Concrete Foundation Check");
    }

    @Test
    @DisplayName("Should throw when quality check not found")
    void shouldThrowException_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(qualityCheckRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> qualityCheckService.getCheck(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Проверка качества не найдена");
    }

    @Test
    @DisplayName("Should soft delete quality check")
    void shouldSoftDelete_whenValidId() {
        when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));
        when(qualityCheckRepository.save(any(QualityCheck.class))).thenAnswer(inv -> inv.getArgument(0));

        qualityCheckService.deleteCheck(checkId);

        assertThat(testCheck.isDeleted()).isTrue();
        verify(auditService).logDelete("QualityCheck", checkId);
    }
}
