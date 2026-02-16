package com.privod.platform.modules.maintenance;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.maintenance.domain.EquipmentStatus;
import com.privod.platform.modules.maintenance.domain.FrequencyType;
import com.privod.platform.modules.maintenance.domain.MaintenanceEquipment;
import com.privod.platform.modules.maintenance.domain.MaintenancePriority;
import com.privod.platform.modules.maintenance.domain.MaintenanceRequest;
import com.privod.platform.modules.maintenance.domain.MaintenanceType;
import com.privod.platform.modules.maintenance.domain.PreventiveSchedule;
import com.privod.platform.modules.maintenance.domain.RequestStatus;
import com.privod.platform.modules.maintenance.repository.MaintenanceEquipmentRepository;
import com.privod.platform.modules.maintenance.repository.MaintenanceRequestRepository;
import com.privod.platform.modules.maintenance.repository.MaintenanceStageRepository;
import com.privod.platform.modules.maintenance.repository.MaintenanceTeamRepository;
import com.privod.platform.modules.maintenance.repository.PreventiveScheduleRepository;
import com.privod.platform.modules.maintenance.service.MaintenanceService;
import com.privod.platform.modules.maintenance.web.dto.CreateEquipmentRequest;
import com.privod.platform.modules.maintenance.web.dto.CreateMaintenanceRequest;
import com.privod.platform.modules.maintenance.web.dto.MaintenanceDashboardData;
import com.privod.platform.modules.maintenance.web.dto.MaintenanceEquipmentResponse;
import com.privod.platform.modules.maintenance.web.dto.MaintenanceRequestResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MaintenanceServiceTest {

    @Mock
    private MaintenanceRequestRepository requestRepository;

    @Mock
    private MaintenanceStageRepository stageRepository;

    @Mock
    private MaintenanceTeamRepository teamRepository;

    @Mock
    private MaintenanceEquipmentRepository equipmentRepository;

    @Mock
    private PreventiveScheduleRepository scheduleRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private MaintenanceService maintenanceService;

    private UUID requestId;
    private UUID equipmentId;
    private UUID teamId;
    private MaintenanceRequest testRequest;
    private MaintenanceEquipment testEquipment;

    @BeforeEach
    void setUp() {
        requestId = UUID.randomUUID();
        equipmentId = UUID.randomUUID();
        teamId = UUID.randomUUID();

        testRequest = MaintenanceRequest.builder()
                .name("Ремонт крана КС-55713")
                .description("Замена троса лебёдки")
                .requestDate(LocalDate.of(2025, 6, 1))
                .equipmentId(equipmentId)
                .equipmentName("Кран КС-55713")
                .maintenanceTeamId(teamId)
                .priority(MaintenancePriority.HIGH)
                .maintenanceType(MaintenanceType.CORRECTIVE)
                .duration(new BigDecimal("8.00"))
                .scheduledDate(LocalDate.of(2025, 6, 5))
                .cost(new BigDecimal("150000.00"))
                .status(RequestStatus.NEW)
                .build();
        testRequest.setId(requestId);
        testRequest.setCreatedAt(Instant.now());

        testEquipment = MaintenanceEquipment.builder()
                .name("Кран КС-55713")
                .serialNumber("SN-12345")
                .model("КС-55713")
                .category("Подъёмные краны")
                .location("Объект Северный")
                .purchaseDate(LocalDate.of(2023, 1, 15))
                .warrantyDate(LocalDate.of(2026, 1, 15))
                .cost(new BigDecimal("5000000.00"))
                .status(EquipmentStatus.OPERATIONAL)
                .maintenanceFrequencyDays(90)
                .build();
        testEquipment.setId(equipmentId);
        testEquipment.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Request")
    class CreateRequestTests {

        @Test
        @DisplayName("Should create maintenance request with NEW status and default NORMAL priority")
        void createRequest_NullPriority_SetsDefaults() {
            CreateMaintenanceRequest dto = new CreateMaintenanceRequest(
                    "Плановый осмотр", "Осмотр оборудования",
                    LocalDate.of(2025, 7, 1), equipmentId, "Кран КС-55713",
                    teamId, UUID.randomUUID(), null,
                    null, null,
                    new BigDecimal("4.00"), LocalDate.of(2025, 7, 5),
                    "Замечания", new BigDecimal("50000.00"));

            when(requestRepository.save(any(MaintenanceRequest.class))).thenAnswer(invocation -> {
                MaintenanceRequest r = invocation.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            MaintenanceRequestResponse response = maintenanceService.createRequest(dto);

            assertThat(response.status()).isEqualTo(RequestStatus.NEW);
            assertThat(response.priority()).isEqualTo(MaintenancePriority.NORMAL);
            assertThat(response.maintenanceType()).isEqualTo(MaintenanceType.CORRECTIVE);
            assertThat(response.name()).isEqualTo("Плановый осмотр");
            verify(auditService).logCreate(eq("MaintenanceRequest"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create request with explicit URGENT priority and PREVENTIVE type")
        void createRequest_ExplicitValues_UsesProvidedValues() {
            CreateMaintenanceRequest dto = new CreateMaintenanceRequest(
                    "Аварийный ремонт", "Повреждение гидравлики",
                    LocalDate.of(2025, 6, 15), equipmentId, "Экскаватор",
                    teamId, null, null,
                    MaintenancePriority.URGENT, MaintenanceType.PREVENTIVE,
                    new BigDecimal("16.00"), null,
                    null, new BigDecimal("300000.00"));

            when(requestRepository.save(any(MaintenanceRequest.class))).thenAnswer(invocation -> {
                MaintenanceRequest r = invocation.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            MaintenanceRequestResponse response = maintenanceService.createRequest(dto);

            assertThat(response.priority()).isEqualTo(MaintenancePriority.URGENT);
            assertThat(response.maintenanceType()).isEqualTo(MaintenanceType.PREVENTIVE);
        }
    }

    @Nested
    @DisplayName("Update Request Status")
    class UpdateRequestStatusTests {

        @Test
        @DisplayName("Should transition from NEW to IN_PROGRESS")
        void updateRequestStatus_NewToInProgress_Succeeds() {
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(requestRepository.save(any(MaintenanceRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            MaintenanceRequestResponse response = maintenanceService.updateRequestStatus(
                    requestId, RequestStatus.IN_PROGRESS);

            assertThat(response.status()).isEqualTo(RequestStatus.IN_PROGRESS);
            verify(auditService).logStatusChange("MaintenanceRequest", requestId, "NEW", "IN_PROGRESS");
        }

        @Test
        @DisplayName("Should transition from IN_PROGRESS to REPAIRED and set completedDate")
        void updateRequestStatus_InProgressToRepaired_SetsCompletedDate() {
            testRequest.setStatus(RequestStatus.IN_PROGRESS);
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(requestRepository.save(any(MaintenanceRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            MaintenanceRequestResponse response = maintenanceService.updateRequestStatus(
                    requestId, RequestStatus.REPAIRED);

            assertThat(response.status()).isEqualTo(RequestStatus.REPAIRED);
            assertThat(response.completedDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should transition from NEW to SCRAP and set completedDate")
        void updateRequestStatus_NewToScrap_SetsCompletedDate() {
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(requestRepository.save(any(MaintenanceRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            MaintenanceRequestResponse response = maintenanceService.updateRequestStatus(
                    requestId, RequestStatus.SCRAP);

            assertThat(response.status()).isEqualTo(RequestStatus.SCRAP);
            assertThat(response.completedDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("Should reject invalid transition from NEW to REPAIRED")
        void updateRequestStatus_NewToRepaired_ThrowsException() {
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));

            assertThatThrownBy(() -> maintenanceService.updateRequestStatus(requestId, RequestStatus.REPAIRED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot transition maintenance request from NEW to REPAIRED");
        }

        @Test
        @DisplayName("Should reject transition from terminal REPAIRED state")
        void updateRequestStatus_RepairedToAny_ThrowsException() {
            testRequest.setStatus(RequestStatus.REPAIRED);
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));

            assertThatThrownBy(() -> maintenanceService.updateRequestStatus(requestId, RequestStatus.IN_PROGRESS))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot transition maintenance request from REPAIRED to IN_PROGRESS");
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for non-existing request")
        void updateRequestStatus_NotFound_ThrowsException() {
            UUID missingId = UUID.randomUUID();
            when(requestRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> maintenanceService.updateRequestStatus(missingId, RequestStatus.IN_PROGRESS))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Maintenance request not found");
        }
    }

    @Nested
    @DisplayName("Create Equipment")
    class CreateEquipmentTests {

        @Test
        @DisplayName("Should create equipment with OPERATIONAL status and set nextMaintenanceDate when frequency > 0")
        void createEquipment_WithFrequency_SetsNextMaintenanceDate() {
            CreateEquipmentRequest dto = new CreateEquipmentRequest(
                    "Бетономешалка", "SN-99999", "БМ-500", "Бетонное оборудование",
                    UUID.randomUUID(), "Объект Южный",
                    LocalDate.of(2024, 5, 1), LocalDate.of(2027, 5, 1),
                    new BigDecimal("800000.00"), null, "Новая",
                    30);

            when(equipmentRepository.save(any(MaintenanceEquipment.class))).thenAnswer(invocation -> {
                MaintenanceEquipment e = invocation.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            MaintenanceEquipmentResponse response = maintenanceService.createEquipment(dto);

            assertThat(response.status()).isEqualTo(EquipmentStatus.OPERATIONAL);
            assertThat(response.maintenanceFrequencyDays()).isEqualTo(30);
            assertThat(response.nextMaintenanceDate()).isEqualTo(LocalDate.now().plusDays(30));
            assertThat(response.name()).isEqualTo("Бетономешалка");
            verify(auditService).logCreate(eq("MaintenanceEquipment"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create equipment with explicit status and null frequency defaults to 0")
        void createEquipment_NullFrequency_DefaultsToZero() {
            CreateEquipmentRequest dto = new CreateEquipmentRequest(
                    "Генератор", "SN-77777", "ГД-200", "Генераторы",
                    null, "Склад",
                    LocalDate.of(2024, 1, 1), null,
                    new BigDecimal("200000.00"), EquipmentStatus.OUT_OF_SERVICE,
                    "На хранении", null);

            when(equipmentRepository.save(any(MaintenanceEquipment.class))).thenAnswer(invocation -> {
                MaintenanceEquipment e = invocation.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            MaintenanceEquipmentResponse response = maintenanceService.createEquipment(dto);

            assertThat(response.status()).isEqualTo(EquipmentStatus.OUT_OF_SERVICE);
            assertThat(response.maintenanceFrequencyDays()).isEqualTo(0);
            assertThat(response.nextMaintenanceDate()).isNull();
        }
    }

    @Nested
    @DisplayName("Process Preventive Schedules")
    class ProcessPreventiveSchedulesTests {

        @Test
        @DisplayName("Should create maintenance requests for due schedules and update next execution")
        void processPreventiveSchedules_DueSchedules_CreatesRequests() {
            LocalDate today = LocalDate.now();
            PreventiveSchedule schedule = PreventiveSchedule.builder()
                    .equipmentId(equipmentId)
                    .maintenanceTeamId(teamId)
                    .name("Ежемесячный осмотр крана")
                    .frequencyType(FrequencyType.MONTHS)
                    .frequencyInterval(1)
                    .nextExecution(today)
                    .isActive(true)
                    .description("Плановый осмотр")
                    .build();
            schedule.setId(UUID.randomUUID());
            schedule.setCreatedAt(Instant.now());

            when(scheduleRepository.findDueSchedules(today)).thenReturn(List.of(schedule));
            when(requestRepository.save(any(MaintenanceRequest.class))).thenAnswer(invocation -> {
                MaintenanceRequest r = invocation.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });
            when(scheduleRepository.save(any(PreventiveSchedule.class))).thenAnswer(inv -> inv.getArgument(0));

            int created = maintenanceService.processPreventiveSchedules();

            assertThat(created).isEqualTo(1);
            assertThat(schedule.getLastExecution()).isEqualTo(today);
            assertThat(schedule.getNextExecution()).isEqualTo(today.plusMonths(1));
            verify(requestRepository).save(any(MaintenanceRequest.class));
            verify(scheduleRepository).save(schedule);
        }

        @Test
        @DisplayName("Should return 0 when no schedules are due")
        void processPreventiveSchedules_NoDue_ReturnsZero() {
            when(scheduleRepository.findDueSchedules(LocalDate.now())).thenReturn(Collections.emptyList());

            int created = maintenanceService.processPreventiveSchedules();

            assertThat(created).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Get Dashboard")
    class GetDashboardTests {

        @Test
        @DisplayName("Should return aggregated dashboard data with correct utilization percentage")
        void getDashboard_WithData_ReturnsCorrectAggregation() {
            when(requestRepository.countOpenRequests()).thenReturn(5L);

            Object[] statusRow1 = new Object[]{RequestStatus.NEW, 3L};
            Object[] statusRow2 = new Object[]{RequestStatus.IN_PROGRESS, 2L};
            Object[] statusRow3 = new Object[]{RequestStatus.REPAIRED, 10L};
            when(requestRepository.countByStatus())
                    .thenReturn(List.of(statusRow1, statusRow2, statusRow3));

            when(requestRepository.avgResolutionDays()).thenReturn(4.5);

            when(equipmentRepository.countTotalEquipment()).thenReturn(20L);
            when(equipmentRepository.countOperationalEquipment()).thenReturn(16L);

            Object[] equipRow1 = new Object[]{EquipmentStatus.OPERATIONAL, 16L};
            Object[] equipRow2 = new Object[]{EquipmentStatus.NEEDS_REPAIR, 4L};
            when(equipmentRepository.countByStatus()).thenReturn(List.of(equipRow1, equipRow2));

            when(requestRepository.findOverdueRequests(any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());
            when(scheduleRepository.findUpcomingSchedules(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            MaintenanceDashboardData dashboard = maintenanceService.getDashboard();

            assertThat(dashboard.openRequests()).isEqualTo(5L);
            assertThat(dashboard.totalRequests()).isEqualTo(15L);
            assertThat(dashboard.requestsByStatus()).containsEntry("NEW", 3L);
            assertThat(dashboard.requestsByStatus()).containsEntry("IN_PROGRESS", 2L);
            assertThat(dashboard.requestsByStatus()).containsEntry("REPAIRED", 10L);
            assertThat(dashboard.avgResolutionDays()).isEqualTo(4.5);
            assertThat(dashboard.totalEquipment()).isEqualTo(20L);
            assertThat(dashboard.operationalEquipment()).isEqualTo(16L);
            assertThat(dashboard.equipmentUtilizationPercent()).isEqualByComparingTo(new BigDecimal("80.00"));
            assertThat(dashboard.equipmentByStatus()).containsEntry("OPERATIONAL", 16L);
            assertThat(dashboard.overdueRequests()).isEmpty();
            assertThat(dashboard.upcomingPreventive()).isEmpty();
        }

        @Test
        @DisplayName("Should return zero utilization when no equipment exists")
        void getDashboard_NoEquipment_ZeroUtilization() {
            when(requestRepository.countOpenRequests()).thenReturn(0L);
            when(requestRepository.countByStatus()).thenReturn(Collections.emptyList());
            when(requestRepository.avgResolutionDays()).thenReturn(null);
            when(equipmentRepository.countTotalEquipment()).thenReturn(0L);
            when(equipmentRepository.countOperationalEquipment()).thenReturn(0L);
            when(equipmentRepository.countByStatus()).thenReturn(Collections.emptyList());
            when(requestRepository.findOverdueRequests(any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());
            when(scheduleRepository.findUpcomingSchedules(any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            MaintenanceDashboardData dashboard = maintenanceService.getDashboard();

            assertThat(dashboard.equipmentUtilizationPercent()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(dashboard.totalEquipment()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("Delete Request")
    class DeleteRequestTests {

        @Test
        @DisplayName("Should soft-delete request and log audit")
        void deleteRequest_ExistingRequest_SoftDeletes() {
            when(requestRepository.findById(requestId)).thenReturn(Optional.of(testRequest));
            when(requestRepository.save(any(MaintenanceRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            maintenanceService.deleteRequest(requestId);

            assertThat(testRequest.isDeleted()).isTrue();
            verify(requestRepository).save(testRequest);
            verify(auditService).logDelete("MaintenanceRequest", requestId);
        }
    }
}
