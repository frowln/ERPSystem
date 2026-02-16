package com.privod.platform.modules.ops;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.ops.domain.Defect;
import com.privod.platform.modules.ops.domain.DefectSeverity;
import com.privod.platform.modules.ops.domain.DefectStatus;
import com.privod.platform.modules.ops.repository.DailyReportRepository;
import com.privod.platform.modules.ops.repository.DefectRepository;
import com.privod.platform.modules.ops.repository.FieldInstructionRepository;
import com.privod.platform.modules.ops.repository.ShiftHandoverRepository;
import com.privod.platform.modules.ops.repository.WeatherRecordRepository;
import com.privod.platform.modules.ops.repository.WorkOrderRepository;
import com.privod.platform.modules.ops.service.OpsService;
import com.privod.platform.modules.ops.web.dto.CreateDefectRequest;
import com.privod.platform.modules.ops.web.dto.DefectResponse;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpsServiceDefectTest {

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private DailyReportRepository dailyReportRepository;

    @Mock
    private DefectRepository defectRepository;

    @Mock
    private FieldInstructionRepository fieldInstructionRepository;

    @Mock
    private WeatherRecordRepository weatherRecordRepository;

    @Mock
    private ShiftHandoverRepository shiftHandoverRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OpsService opsService;

    private UUID defectId;
    private UUID projectId;
    private Defect testDefect;

    @BeforeEach
    void setUp() {
        defectId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testDefect = Defect.builder()
                .projectId(projectId)
                .code("ДЕФ-00001")
                .title("Трещина в фундаменте")
                .description("Обнаружена трещина шириной 2мм")
                .location("Корпус А, секция 1")
                .severity(DefectSeverity.HIGH)
                .status(DefectStatus.OPEN)
                .build();
        testDefect.setId(defectId);
        testDefect.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Defect")
    class CreateTests {

        @Test
        @DisplayName("Should create defect with auto-generated code")
        void createDefect_Success() {
            CreateDefectRequest request = new CreateDefectRequest(
                    projectId, "Трещина в фундаменте", "Трещина 2мм",
                    "Корпус А", DefectSeverity.HIGH, null,
                    UUID.randomUUID(), UUID.randomUUID(),
                    LocalDate.of(2025, 8, 15));

            when(defectRepository.getNextCodeSequence()).thenReturn(1L);
            when(defectRepository.save(any(Defect.class))).thenAnswer(invocation -> {
                Defect d = invocation.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            DefectResponse response = opsService.createDefect(request);

            assertThat(response.status()).isEqualTo(DefectStatus.OPEN);
            assertThat(response.code()).isEqualTo("ДЕФ-00001");
            assertThat(response.severity()).isEqualTo(DefectSeverity.HIGH);
            assertThat(response.severityDisplayName()).isEqualTo("Высокая");
            verify(auditService).logCreate(eq("Defect"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create defect with default MEDIUM severity")
        void createDefect_DefaultSeverity() {
            CreateDefectRequest request = new CreateDefectRequest(
                    projectId, "Мелкий дефект", null, null,
                    null, null, null, null, null);

            when(defectRepository.getNextCodeSequence()).thenReturn(2L);
            when(defectRepository.save(any(Defect.class))).thenAnswer(invocation -> {
                Defect d = invocation.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            DefectResponse response = opsService.createDefect(request);

            assertThat(response.severity()).isEqualTo(DefectSeverity.MEDIUM);
        }
    }

    @Nested
    @DisplayName("Defect Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should transition from OPEN to IN_PROGRESS")
        void startDefect_Success() {
            when(defectRepository.findById(defectId)).thenReturn(Optional.of(testDefect));
            when(defectRepository.save(any(Defect.class))).thenAnswer(inv -> inv.getArgument(0));

            DefectResponse response = opsService.transitionDefectStatus(defectId, DefectStatus.IN_PROGRESS);

            assertThat(response.status()).isEqualTo(DefectStatus.IN_PROGRESS);
            verify(auditService).logStatusChange("Defect", defectId, "OPEN", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should transition to FIXED and set fixedAt timestamp")
        void fixDefect_SetsFixedAt() {
            testDefect.setStatus(DefectStatus.IN_PROGRESS);
            when(defectRepository.findById(defectId)).thenReturn(Optional.of(testDefect));
            when(defectRepository.save(any(Defect.class))).thenAnswer(inv -> inv.getArgument(0));

            DefectResponse response = opsService.transitionDefectStatus(defectId, DefectStatus.FIXED);

            assertThat(response.status()).isEqualTo(DefectStatus.FIXED);
            assertThat(testDefect.getFixedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject invalid defect status transition")
        void invalidTransition() {
            when(defectRepository.findById(defectId)).thenReturn(Optional.of(testDefect));

            assertThatThrownBy(() -> opsService.transitionDefectStatus(defectId, DefectStatus.CLOSED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести дефект");
        }
    }

    @Test
    @DisplayName("Should throw when defect not found")
    void getDefect_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(defectRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> opsService.getDefect(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Дефект не найден");
    }
}
