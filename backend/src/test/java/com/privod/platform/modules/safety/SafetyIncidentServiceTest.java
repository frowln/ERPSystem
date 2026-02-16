package com.privod.platform.modules.safety;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.safety.domain.IncidentSeverity;
import com.privod.platform.modules.safety.domain.IncidentStatus;
import com.privod.platform.modules.safety.domain.IncidentType;
import com.privod.platform.modules.safety.domain.SafetyIncident;
import com.privod.platform.modules.safety.repository.SafetyIncidentRepository;
import com.privod.platform.modules.safety.service.SafetyIncidentService;
import com.privod.platform.modules.safety.web.dto.CreateIncidentRequest;
import com.privod.platform.modules.safety.web.dto.IncidentDashboardResponse;
import com.privod.platform.modules.safety.web.dto.IncidentResponse;
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
import java.time.LocalDateTime;
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
    private SafetyIncidentService incidentService;

    private UUID incidentId;
    private UUID projectId;
    private SafetyIncident testIncident;

    @BeforeEach
    void setUp() {
        incidentId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testIncident = SafetyIncident.builder()
                .number("INC-00001")
                .incidentDate(LocalDateTime.of(2025, 3, 15, 10, 30))
                .projectId(projectId)
                .locationDescription("Строительная площадка, блок А")
                .severity(IncidentSeverity.MODERATE)
                .incidentType(IncidentType.FALL)
                .status(IncidentStatus.REPORTED)
                .description("Падение рабочего с лесов на высоте 3 метра")
                .reportedById(UUID.randomUUID())
                .reportedByName("Сидоров А.П.")
                .injuredEmployeeId(UUID.randomUUID())
                .injuredEmployeeName("Козлов И.В.")
                .workDaysLost(5)
                .medicalTreatment(true)
                .hospitalization(false)
                .build();
        testIncident.setId(incidentId);
        testIncident.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Incident")
    class CreateIncidentTests {

        @Test
        @DisplayName("Should create incident with REPORTED status and generated number")
        void createIncident_SetsDefaultReportedStatus() {
            CreateIncidentRequest request = new CreateIncidentRequest(
                    LocalDateTime.of(2025, 4, 1, 14, 0),
                    projectId, "Корпус Б, 3 этаж",
                    IncidentSeverity.SERIOUS, IncidentType.INJURY,
                    "Травма руки при работе с бетономешалкой",
                    UUID.randomUUID(), "Иванов И.И.",
                    UUID.randomUUID(), "Петров П.П.",
                    "Сидоров С.С.", 10, true, false, null);

            when(incidentRepository.getNextNumberSequence()).thenReturn(1L);
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(invocation -> {
                SafetyIncident i = invocation.getArgument(0);
                i.setId(UUID.randomUUID());
                i.setCreatedAt(Instant.now());
                return i;
            });

            IncidentResponse response = incidentService.createIncident(request);

            assertThat(response.status()).isEqualTo(IncidentStatus.REPORTED);
            assertThat(response.severity()).isEqualTo(IncidentSeverity.SERIOUS);
            assertThat(response.workDaysLost()).isEqualTo(10);
            verify(auditService).logCreate(eq("SafetyIncident"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should transition from REPORTED to UNDER_INVESTIGATION")
        void investigate_ValidTransition() {
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(inv -> inv.getArgument(0));

            UUID investigatorId = UUID.randomUUID();
            IncidentResponse response = incidentService.investigate(incidentId, investigatorId, "Эксперт А.Б.");

            assertThat(response.status()).isEqualTo(IncidentStatus.UNDER_INVESTIGATION);
            assertThat(response.investigatorName()).isEqualTo("Эксперт А.Б.");
            verify(auditService).logStatusChange("SafetyIncident", incidentId,
                    "REPORTED", "UNDER_INVESTIGATION");
        }

        @Test
        @DisplayName("Should transition from UNDER_INVESTIGATION to CORRECTIVE_ACTION")
        void addCorrectiveAction_ValidTransition() {
            testIncident.setStatus(IncidentStatus.UNDER_INVESTIGATION);
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));
            when(incidentRepository.save(any(SafetyIncident.class))).thenAnswer(inv -> inv.getArgument(0));

            IncidentResponse response = incidentService.addCorrectiveAction(incidentId,
                    "Отсутствие страховочного оборудования",
                    "Установить ограждения и выдать страховочные системы");

            assertThat(response.status()).isEqualTo(IncidentStatus.CORRECTIVE_ACTION);
            assertThat(response.rootCause()).isEqualTo("Отсутствие страховочного оборудования");
            verify(auditService).logStatusChange("SafetyIncident", incidentId,
                    "UNDER_INVESTIGATION", "CORRECTIVE_ACTION");
        }

        @Test
        @DisplayName("Should reject invalid transition from REPORTED to RESOLVED")
        void resolveIncident_InvalidTransition() {
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));

            assertThatThrownBy(() -> incidentService.resolveIncident(incidentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести инцидент");
        }
    }

    @Nested
    @DisplayName("Get Incident")
    class GetIncidentTests {

        @Test
        @DisplayName("Should find incident by ID")
        void getIncident_Success() {
            when(incidentRepository.findById(incidentId)).thenReturn(Optional.of(testIncident));

            IncidentResponse response = incidentService.getIncident(incidentId);

            assertThat(response).isNotNull();
            assertThat(response.number()).isEqualTo("INC-00001");
            assertThat(response.severity()).isEqualTo(IncidentSeverity.MODERATE);
        }

        @Test
        @DisplayName("Should throw when incident not found")
        void getIncident_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(incidentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> incidentService.getIncident(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Инцидент не найден");
        }
    }

    @Nested
    @DisplayName("Dashboard")
    class DashboardTests {

        @Test
        @DisplayName("Should return incident dashboard statistics")
        void getDashboard_ReturnsStats() {
            when(incidentRepository.countTotal(projectId)).thenReturn(8L);
            when(incidentRepository.countBySeverity(projectId))
                    .thenReturn(List.of(
                            new Object[]{IncidentSeverity.MINOR, 3L},
                            new Object[]{IncidentSeverity.MODERATE, 4L},
                            new Object[]{IncidentSeverity.SERIOUS, 1L}
                    ));
            when(incidentRepository.countByType(projectId))
                    .thenReturn(List.of(
                            new Object[]{IncidentType.FALL, 5L},
                            new Object[]{IncidentType.INJURY, 3L}
                    ));
            when(incidentRepository.countByStatus(projectId))
                    .thenReturn(List.of(
                            new Object[]{IncidentStatus.REPORTED, 2L},
                            new Object[]{IncidentStatus.RESOLVED, 6L}
                    ));
            when(incidentRepository.sumWorkDaysLost(projectId)).thenReturn(25);

            IncidentDashboardResponse response = incidentService.getDashboard(projectId);

            assertThat(response.totalIncidents()).isEqualTo(8L);
            assertThat(response.severityCounts()).containsEntry("MODERATE", 4L);
            assertThat(response.typeCounts()).containsEntry("FALL", 5L);
            assertThat(response.statusCounts()).containsEntry("RESOLVED", 6L);
            assertThat(response.totalWorkDaysLost()).isEqualTo(25);
        }
    }
}
