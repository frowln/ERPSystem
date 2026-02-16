package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.safety.domain.IncidentSeverity;
import com.privod.platform.modules.safety.domain.IncidentStatus;
import com.privod.platform.modules.safety.domain.IncidentType;
import com.privod.platform.modules.safety.domain.SafetyIncident;
import com.privod.platform.modules.safety.repository.SafetyIncidentRepository;
import com.privod.platform.modules.safety.web.dto.CreateIncidentRequest;
import com.privod.platform.modules.safety.web.dto.IncidentDashboardResponse;
import com.privod.platform.modules.safety.web.dto.IncidentResponse;
import com.privod.platform.modules.safety.web.dto.UpdateIncidentRequest;
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
class SafetyIncidentServiceTest {

    @Mock
    private SafetyIncidentRepository incidentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SafetyIncidentService safetyIncidentService;

    private UUID incidentId;
    private UUID projectId;
    private SafetyIncident testIncident;

    @BeforeEach
    void setUp() {
        incidentId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testIncident = SafetyIncident.builder()
                .number("INC-00001")
                .incidentDate(Instant.now())
                .projectId(projectId)
                .locationDescription("Building A, Floor 3")
                .severity(IncidentSeverity.MEDIUM)
                .incidentType(IncidentType.FALL)
                .status(IncidentStatus.REPORTED)
                .description("Worker fell from scaffolding")
                .reportedByName("Ivanov I.I.")
                .workDaysLost(0)
                .build();
        testIncident.setId(incidentId);
        testIncident.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Incident")
    class CreateTests {

        @Test
        @DisplayName("Should create incident with REPORTED status")
        void shouldCreate_withReportedStatus() {
            CreateIncidentRequest request = new CreateIncidentRequest(
                    Instant.now(), projectId, "Warehouse area",
                    IncidentSeverity.HIGH, IncidentType.EQUIPMENT_FAILURE,
                    "Crane malfunction", null, "Petrov P.P.",
                    null, null, null, 0, false, false, "Urgent attention");

            when(incidentRepository.getNextNumberSequence()).thenReturn(2L);
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(inv -> {
                SafetyIncident si = inv.getArgument(0);
                si.setId(UUID.randomUUID());
                si.setCreatedAt(Instant.now());
                return si;
            });

            IncidentResponse response = safetyIncidentService.createIncident(request);

            assertThat(response.status()).isEqualTo(IncidentStatus.REPORTED);
            assertThat(response.number()).isEqualTo("INC-00002");
            verify(auditService).logCreate(eq("SafetyIncident"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default workDaysLost to 0 when null")
        void shouldDefaultWorkDaysLost_whenNull() {
            CreateIncidentRequest request = new CreateIncidentRequest(
                    Instant.now(), projectId, "Site entrance",
                    IncidentSeverity.LOW, IncidentType.NEAR_MISS,
                    "Near miss event", null, "Sidorov",
                    null, null, null, null, null, null, null);

            when(incidentRepository.getNextNumberSequence()).thenReturn(3L);
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(inv -> {
                SafetyIncident si = inv.getArgument(0);
                si.setId(UUID.randomUUID());
                si.setCreatedAt(Instant.now());
                return si;
            });

            IncidentResponse response = safetyIncidentService.createIncident(request);

            assertThat(response.workDaysLost()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Update Incident")
    class UpdateTests {

        @Test
        @DisplayName("Should update incident fields")
        void shouldUpdate_whenValidInput() {
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateIncidentRequest request = new UpdateIncidentRequest(
                    null, null, null, IncidentSeverity.HIGH, null,
                    null, "Improper scaffolding setup", "Install guardrails",
                    null, null, null, null, null, null,
                    5, true, false, "Follow-up needed");

            IncidentResponse response = safetyIncidentService.updateIncident(incidentId, request);

            assertThat(response).isNotNull();
            verify(auditService).logUpdate(eq("SafetyIncident"), eq(incidentId), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Incident Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should investigate incident from REPORTED")
        void shouldInvestigate_whenReported() {
            UUID investigatorId = UUID.randomUUID();
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(inv -> inv.getArgument(0));

            IncidentResponse response = safetyIncidentService.investigate(
                    incidentId, investigatorId, "Kuznetsov K.K.");

            assertThat(response.status()).isEqualTo(IncidentStatus.UNDER_INVESTIGATION);
            verify(auditService).logStatusChange("SafetyIncident", incidentId,
                    "REPORTED", "UNDER_INVESTIGATION");
        }

        @Test
        @DisplayName("Should add corrective action from UNDER_INVESTIGATION")
        void shouldAddCorrectiveAction_whenUnderInvestigation() {
            testIncident.setStatus(IncidentStatus.UNDER_INVESTIGATION);
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(inv -> inv.getArgument(0));

            IncidentResponse response = safetyIncidentService.addCorrectiveAction(
                    incidentId, "Improper scaffolding", "Install guardrails");

            assertThat(response.status()).isEqualTo(IncidentStatus.CORRECTIVE_ACTION);
            verify(auditService).logStatusChange("SafetyIncident", incidentId,
                    "UNDER_INVESTIGATION", "CORRECTIVE_ACTION");
        }

        @Test
        @DisplayName("Should resolve incident from CORRECTIVE_ACTION")
        void shouldResolve_whenCorrectiveAction() {
            testIncident.setStatus(IncidentStatus.CORRECTIVE_ACTION);
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(inv -> inv.getArgument(0));

            IncidentResponse response = safetyIncidentService.resolveIncident(incidentId);

            assertThat(response.status()).isEqualTo(IncidentStatus.RESOLVED);
            verify(auditService).logStatusChange("SafetyIncident", incidentId,
                    "CORRECTIVE_ACTION", "RESOLVED");
        }

        @Test
        @DisplayName("Should close incident from RESOLVED")
        void shouldClose_whenResolved() {
            testIncident.setStatus(IncidentStatus.RESOLVED);
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(inv -> inv.getArgument(0));

            IncidentResponse response = safetyIncidentService.closeIncident(incidentId);

            assertThat(response.status()).isEqualTo(IncidentStatus.CLOSED);
        }

        @Test
        @DisplayName("Should reject invalid status transition")
        void shouldThrowException_whenInvalidTransition() {
            testIncident.setStatus(IncidentStatus.CLOSED);
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));

            assertThatThrownBy(() -> safetyIncidentService.investigate(
                    incidentId, UUID.randomUUID(), "Inspector"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести инцидент");
        }
    }

    @Test
    @DisplayName("Should return incident dashboard")
    void shouldReturnDashboard() {
        when(incidentRepository.countTotal(projectId)).thenReturn(15L);
        when(incidentRepository.countBySeverity(projectId)).thenReturn(List.of(
                new Object[]{IncidentSeverity.HIGH, 3L},
                new Object[]{IncidentSeverity.MEDIUM, 7L}
        ));
        when(incidentRepository.countByType(projectId)).thenReturn(List.of(
                new Object[]{IncidentType.FALL, 5L}
        ));
        when(incidentRepository.countByStatus(projectId)).thenReturn(List.of(
                new Object[]{IncidentStatus.REPORTED, 4L}
        ));
        when(incidentRepository.sumWorkDaysLost(projectId)).thenReturn(25);

        IncidentDashboardResponse dashboard = safetyIncidentService.getDashboard(projectId);

        assertThat(dashboard.totalIncidents()).isEqualTo(15L);
        assertThat(dashboard.totalWorkDaysLost()).isEqualTo(25);
    }

    @Test
    @DisplayName("Should find incident by ID")
    void shouldReturnIncident_whenExists() {
        when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));

        IncidentResponse response = safetyIncidentService.getIncident(incidentId);

        assertThat(response).isNotNull();
        assertThat(response.number()).isEqualTo("INC-00001");
    }

    @Test
    @DisplayName("Should throw when incident not found")
    void shouldThrowException_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(incidentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> safetyIncidentService.getIncident(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Инцидент не найден");
    }
}
