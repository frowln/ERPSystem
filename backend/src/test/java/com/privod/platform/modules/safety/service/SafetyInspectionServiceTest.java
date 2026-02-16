package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.safety.domain.InspectionStatus;
import com.privod.platform.modules.safety.domain.SafetyInspection;
import com.privod.platform.modules.safety.domain.SafetyViolation;
import com.privod.platform.modules.safety.repository.SafetyInspectionRepository;
import com.privod.platform.modules.safety.repository.SafetyViolationRepository;
import com.privod.platform.modules.safety.web.dto.CreateInspectionRequest;
import com.privod.platform.modules.safety.web.dto.CreateViolationRequest;
import com.privod.platform.modules.safety.web.dto.InspectionResponse;
import com.privod.platform.modules.safety.web.dto.UpdateInspectionRequest;
import com.privod.platform.modules.safety.web.dto.ViolationResponse;
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
class SafetyInspectionServiceTest {

    @Mock
    private SafetyInspectionRepository inspectionRepository;

    @Mock
    private SafetyViolationRepository violationRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SafetyInspectionService safetyInspectionService;

    private UUID inspectionId;
    private UUID projectId;
    private SafetyInspection testInspection;

    @BeforeEach
    void setUp() {
        inspectionId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testInspection = SafetyInspection.builder()
                .number("INS-00001")
                .inspectionDate(LocalDate.now())
                .projectId(projectId)
                .inspectorName("Ivanov I.I.")
                .inspectionType("ROUTINE")
                .status(InspectionStatus.PLANNED)
                .notes("Scheduled routine inspection")
                .build();
        testInspection.setId(inspectionId);
        testInspection.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Inspection")
    class CreateTests {

        @Test
        @DisplayName("Should create inspection with PLANNED status")
        void shouldCreate_withPlannedStatus() {
            CreateInspectionRequest request = new CreateInspectionRequest(
                    LocalDate.now(), projectId, null, "Petrov P.P.",
                    "TARGETED", "Check fire safety");

            when(inspectionRepository.getNextNumberSequence()).thenReturn(2L);
            when(inspectionRepository.save(any(SafetyInspection.class))).thenAnswer(inv -> {
                SafetyInspection si = inv.getArgument(0);
                si.setId(UUID.randomUUID());
                si.setCreatedAt(Instant.now());
                return si;
            });

            InspectionResponse response = safetyInspectionService.createInspection(request);

            assertThat(response.status()).isEqualTo(InspectionStatus.PLANNED);
            assertThat(response.number()).isEqualTo("INS-00002");
            verify(auditService).logCreate(eq("SafetyInspection"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Update Inspection")
    class UpdateTests {

        @Test
        @DisplayName("Should update inspection fields")
        void shouldUpdate_whenValidInput() {
            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));
            when(inspectionRepository.save(any(SafetyInspection.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateInspectionRequest request = new UpdateInspectionRequest(
                    null, null, null, null, null, null,
                    4, "Minor issues found", "Improve signage",
                    LocalDate.now().plusMonths(3), "Updated notes");

            InspectionResponse response = safetyInspectionService.updateInspection(inspectionId, request);

            assertThat(response).isNotNull();
            verify(auditService).logUpdate(eq("SafetyInspection"), eq(inspectionId), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Inspection Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should start inspection from PLANNED")
        void shouldStart_whenPlanned() {
            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));
            when(inspectionRepository.save(any(SafetyInspection.class))).thenAnswer(inv -> inv.getArgument(0));

            InspectionResponse response = safetyInspectionService.startInspection(inspectionId);

            assertThat(response.status()).isEqualTo(InspectionStatus.IN_PROGRESS);
            verify(auditService).logStatusChange("SafetyInspection", inspectionId,
                    "PLANNED", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should reject start when not PLANNED")
        void shouldThrowException_whenStartFromNonPlanned() {
            testInspection.setStatus(InspectionStatus.COMPLETED);
            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));

            assertThatThrownBy(() -> safetyInspectionService.startInspection(inspectionId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("запланированную проверку");
        }

        @Test
        @DisplayName("Should complete inspection from IN_PROGRESS")
        void shouldComplete_whenInProgress() {
            testInspection.setStatus(InspectionStatus.IN_PROGRESS);
            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));
            when(inspectionRepository.save(any(SafetyInspection.class))).thenAnswer(inv -> inv.getArgument(0));

            InspectionResponse response = safetyInspectionService.completeInspection(inspectionId);

            assertThat(response.status()).isEqualTo(InspectionStatus.COMPLETED);
            verify(auditService).logStatusChange("SafetyInspection", inspectionId,
                    "IN_PROGRESS", "COMPLETED");
        }

        @Test
        @DisplayName("Should reject complete when not IN_PROGRESS")
        void shouldThrowException_whenCompleteFromNonInProgress() {
            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));

            assertThatThrownBy(() -> safetyInspectionService.completeInspection(inspectionId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("в процессе выполнения");
        }

        @Test
        @DisplayName("Should cancel inspection from PLANNED")
        void shouldCancel_whenPlanned() {
            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));
            when(inspectionRepository.save(any(SafetyInspection.class))).thenAnswer(inv -> inv.getArgument(0));

            InspectionResponse response = safetyInspectionService.cancelInspection(inspectionId);

            assertThat(response.status()).isEqualTo(InspectionStatus.CANCELLED);
        }

        @Test
        @DisplayName("Should reject cancel when already COMPLETED")
        void shouldThrowException_whenCancelCompleted() {
            testInspection.setStatus(InspectionStatus.COMPLETED);
            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));

            assertThatThrownBy(() -> safetyInspectionService.cancelInspection(inspectionId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("завершённую");
        }
    }

    @Nested
    @DisplayName("Violations")
    class ViolationTests {

        @Test
        @DisplayName("Should add violation to inspection")
        void shouldAddViolation() {
            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));
            when(violationRepository.save(any(SafetyViolation.class))).thenAnswer(inv -> {
                SafetyViolation v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                v.setCreatedAt(Instant.now());
                return v;
            });

            CreateViolationRequest request = new CreateViolationRequest(
                    null, "Missing safety rails on scaffolding",
                    "HIGH", LocalDate.now().plusDays(7), null, "Worker A");

            ViolationResponse response = safetyInspectionService.addViolationToInspection(inspectionId, request);

            assertThat(response).isNotNull();
            verify(auditService).logCreate(eq("SafetyViolation"), any(UUID.class));
        }

        @Test
        @DisplayName("Should return inspection violations")
        void shouldReturnViolations() {
            SafetyViolation violation = SafetyViolation.builder()
                    .inspectionId(inspectionId)
                    .description("Missing fire extinguisher")
                    .severity("MEDIUM")
                    .build();
            violation.setId(UUID.randomUUID());
            violation.setCreatedAt(Instant.now());

            when(inspectionRepository.findById(inspectionId)).thenReturn(Optional.of(testInspection));
            when(violationRepository.findByInspectionIdAndDeletedFalse(inspectionId))
                    .thenReturn(List.of(violation));

            List<ViolationResponse> violations = safetyInspectionService.getInspectionViolations(inspectionId);

            assertThat(violations).hasSize(1);
        }
    }

    @Test
    @DisplayName("Should throw when inspection not found")
    void shouldThrowException_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(inspectionRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> safetyInspectionService.getInspection(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Проверка не найдена");
    }
}
