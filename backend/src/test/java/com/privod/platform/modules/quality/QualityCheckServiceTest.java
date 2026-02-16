package com.privod.platform.modules.quality;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.quality.domain.CheckResult;
import com.privod.platform.modules.quality.domain.CheckStatus;
import com.privod.platform.modules.quality.domain.CheckType;
import com.privod.platform.modules.quality.domain.QualityCheck;
import com.privod.platform.modules.quality.repository.QualityCheckRepository;
import com.privod.platform.modules.quality.service.QualityCheckService;
import com.privod.platform.modules.quality.web.dto.CreateQualityCheckRequest;
import com.privod.platform.modules.quality.web.dto.QualityCheckResponse;
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
                .checkType(CheckType.INCOMING_MATERIAL)
                .name("Входной контроль арматуры А500")
                .description("Проверка качества арматурной стали")
                .plannedDate(LocalDate.of(2025, 6, 15))
                .inspectorId(UUID.randomUUID())
                .inspectorName("Козлов А.В.")
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
        void createCheck_SetsDefaults() {
            CreateQualityCheckRequest request = new CreateQualityCheckRequest(
                    projectId, null, null,
                    CheckType.INCOMING_MATERIAL,
                    "Входной контроль бетона М300",
                    "Проверка прочности бетонной смеси",
                    LocalDate.of(2025, 7, 1),
                    UUID.randomUUID(), "Иванов И.И.",
                    null
            );

            when(qualityCheckRepository.getNextNumberSequence()).thenReturn(1L);
            when(qualityCheckRepository.save(any(QualityCheck.class))).thenAnswer(inv -> {
                QualityCheck qc = inv.getArgument(0);
                qc.setId(UUID.randomUUID());
                qc.setCreatedAt(Instant.now());
                return qc;
            });

            QualityCheckResponse response = qualityCheckService.createCheck(request);

            assertThat(response.status()).isEqualTo(CheckStatus.PLANNED);
            assertThat(response.result()).isEqualTo(CheckResult.PENDING);
            assertThat(response.code()).isEqualTo("QC-00001");
            assertThat(response.checkType()).isEqualTo(CheckType.INCOMING_MATERIAL);
            verify(auditService).logCreate(eq("QualityCheck"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should transition from PLANNED to IN_PROGRESS")
        void startCheck_ValidTransition() {
            when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));
            when(qualityCheckRepository.save(any(QualityCheck.class))).thenAnswer(inv -> inv.getArgument(0));

            QualityCheckResponse response = qualityCheckService.startCheck(checkId);

            assertThat(response.status()).isEqualTo(CheckStatus.IN_PROGRESS);
            assertThat(response.actualDate()).isEqualTo(LocalDate.now());
            verify(auditService).logStatusChange("QualityCheck", checkId,
                    "PLANNED", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should complete check with PASS result")
        void completeCheck_WithResult() {
            testCheck.setStatus(CheckStatus.IN_PROGRESS);
            when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));
            when(qualityCheckRepository.save(any(QualityCheck.class))).thenAnswer(inv -> inv.getArgument(0));

            QualityCheckResponse response = qualityCheckService.completeCheck(
                    checkId, CheckResult.PASS,
                    "Все параметры соответствуют ГОСТ",
                    "Рекомендуется повторная проверка через 30 дней"
            );

            assertThat(response.status()).isEqualTo(CheckStatus.COMPLETED);
            assertThat(response.result()).isEqualTo(CheckResult.PASS);
            assertThat(response.findings()).isEqualTo("Все параметры соответствуют ГОСТ");
        }

        @Test
        @DisplayName("Should reject start from non-PLANNED status")
        void startCheck_InvalidTransition() {
            testCheck.setStatus(CheckStatus.COMPLETED);
            when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));

            assertThatThrownBy(() -> qualityCheckService.startCheck(checkId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно начать проверку");
        }
    }

    @Nested
    @DisplayName("Get Quality Check")
    class GetTests {

        @Test
        @DisplayName("Should find check by ID")
        void getCheck_Success() {
            when(qualityCheckRepository.findById(checkId)).thenReturn(Optional.of(testCheck));

            QualityCheckResponse response = qualityCheckService.getCheck(checkId);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("QC-00001");
            assertThat(response.checkType()).isEqualTo(CheckType.INCOMING_MATERIAL);
        }

        @Test
        @DisplayName("Should throw when check not found")
        void getCheck_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(qualityCheckRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> qualityCheckService.getCheck(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Проверка качества не найдена");
        }
    }
}
