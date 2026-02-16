package com.privod.platform.modules.fleet;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.fleet.domain.MaintenanceRecord;
import com.privod.platform.modules.fleet.domain.MaintenanceStatus;
import com.privod.platform.modules.fleet.domain.MaintenanceType;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.domain.VehicleType;
import com.privod.platform.modules.fleet.repository.MaintenanceRecordRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.service.MaintenanceService;
import com.privod.platform.modules.fleet.web.dto.CreateMaintenanceRequest;
import com.privod.platform.modules.fleet.web.dto.MaintenanceRecordResponse;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MaintenanceServiceTest {

    @Mock
    private MaintenanceRecordRepository maintenanceRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private MaintenanceService maintenanceService;

    private UUID vehicleId;
    private UUID maintenanceId;
    private Vehicle testVehicle;
    private MaintenanceRecord testRecord;

    @BeforeEach
    void setUp() {
        vehicleId = UUID.randomUUID();
        maintenanceId = UUID.randomUUID();

        testVehicle = Vehicle.builder()
                .code("VEH-00001")
                .vehicleType(VehicleType.EXCAVATOR)
                .status(VehicleStatus.AVAILABLE)
                .build();
        testVehicle.setId(vehicleId);
        testVehicle.setCreatedAt(Instant.now());

        testRecord = MaintenanceRecord.builder()
                .vehicleId(vehicleId)
                .maintenanceType(MaintenanceType.SCHEDULED)
                .description("Плановое ТО-1")
                .startDate(LocalDate.of(2026, 3, 1))
                .status(MaintenanceStatus.PLANNED)
                .cost(new BigDecimal("150000.00"))
                .vendor("ООО СервисТехника")
                .build();
        testRecord.setId(maintenanceId);
        testRecord.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Schedule Maintenance")
    class ScheduleMaintenanceTests {

        @Test
        @DisplayName("Should schedule maintenance with PLANNED status")
        void scheduleMaintenance_Success() {
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
            when(maintenanceRepository.save(any(MaintenanceRecord.class))).thenAnswer(inv -> {
                MaintenanceRecord r = inv.getArgument(0);
                r.setId(UUID.randomUUID());
                r.setCreatedAt(Instant.now());
                return r;
            });

            CreateMaintenanceRequest request = new CreateMaintenanceRequest(
                    vehicleId, MaintenanceType.SCHEDULED, "Плановое ТО-1",
                    LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 3),
                    new BigDecimal("150000.00"), null, "ООО СервисТехника",
                    null, new BigDecimal("2000.00"),
                    null, new BigDecimal("2500.00"), LocalDate.of(2026, 9, 1)
            );

            MaintenanceRecordResponse response = maintenanceService.schedule(request);

            assertThat(response.status()).isEqualTo(MaintenanceStatus.PLANNED);
            assertThat(response.maintenanceType()).isEqualTo(MaintenanceType.SCHEDULED);
            assertThat(response.cost()).isEqualByComparingTo(new BigDecimal("150000.00"));
            verify(auditService).logCreate(eq("MaintenanceRecord"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject scheduling for non-existent vehicle")
        void scheduleMaintenance_VehicleNotFound() {
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.empty());

            CreateMaintenanceRequest request = new CreateMaintenanceRequest(
                    vehicleId, MaintenanceType.SCHEDULED, null,
                    LocalDate.now(), null, null, null, null,
                    null, null, null, null, null
            );

            assertThatThrownBy(() -> maintenanceService.schedule(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Техника не найдена");
        }
    }

    @Nested
    @DisplayName("Maintenance Workflow")
    class MaintenanceWorkflowTests {

        @Test
        @DisplayName("Should start maintenance and set vehicle status to MAINTENANCE")
        void startMaintenance_Success() {
            when(maintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(testRecord));
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
            when(maintenanceRepository.save(any(MaintenanceRecord.class))).thenAnswer(inv -> inv.getArgument(0));
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

            MaintenanceRecordResponse response = maintenanceService.startMaintenance(maintenanceId);

            assertThat(response.status()).isEqualTo(MaintenanceStatus.IN_PROGRESS);
            assertThat(testVehicle.getStatus()).isEqualTo(VehicleStatus.MAINTENANCE);
            verify(auditService).logStatusChange("MaintenanceRecord", maintenanceId,
                    "PLANNED", "IN_PROGRESS");
            verify(auditService).logStatusChange("Vehicle", vehicleId,
                    "AVAILABLE", "MAINTENANCE");
        }

        @Test
        @DisplayName("Should complete maintenance and restore vehicle to AVAILABLE")
        void completeMaintenance_Success() {
            testRecord.setStatus(MaintenanceStatus.IN_PROGRESS);
            testVehicle.setStatus(VehicleStatus.MAINTENANCE);

            when(maintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(testRecord));
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
            when(maintenanceRepository.save(any(MaintenanceRecord.class))).thenAnswer(inv -> inv.getArgument(0));
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

            MaintenanceRecordResponse response = maintenanceService.completeMaintenance(maintenanceId);

            assertThat(response.status()).isEqualTo(MaintenanceStatus.COMPLETED);
            assertThat(response.endDate()).isEqualTo(LocalDate.now());
            assertThat(testVehicle.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
            verify(auditService).logStatusChange("MaintenanceRecord", maintenanceId,
                    "IN_PROGRESS", "COMPLETED");
        }

        @Test
        @DisplayName("Should reject starting non-planned maintenance")
        void startMaintenance_NotPlanned() {
            testRecord.setStatus(MaintenanceStatus.IN_PROGRESS);
            when(maintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(testRecord));

            assertThatThrownBy(() -> maintenanceService.startMaintenance(maintenanceId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Начать можно только запланированное обслуживание");
        }

        @Test
        @DisplayName("Should reject completing non-in-progress maintenance")
        void completeMaintenance_NotInProgress() {
            when(maintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(testRecord));

            assertThatThrownBy(() -> maintenanceService.completeMaintenance(maintenanceId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Завершить можно только обслуживание в работе");
        }

        @Test
        @DisplayName("Should cancel in-progress maintenance and restore vehicle")
        void cancelMaintenance_InProgress() {
            testRecord.setStatus(MaintenanceStatus.IN_PROGRESS);
            testVehicle.setStatus(VehicleStatus.MAINTENANCE);

            when(maintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(testRecord));
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
            when(maintenanceRepository.save(any(MaintenanceRecord.class))).thenAnswer(inv -> inv.getArgument(0));
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

            MaintenanceRecordResponse response = maintenanceService.cancelMaintenance(maintenanceId);

            assertThat(response.status()).isEqualTo(MaintenanceStatus.CANCELLED);
            assertThat(testVehicle.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        }

        @Test
        @DisplayName("Should reject cancelling completed maintenance")
        void cancelMaintenance_AlreadyCompleted() {
            testRecord.setStatus(MaintenanceStatus.COMPLETED);
            when(maintenanceRepository.findById(maintenanceId)).thenReturn(Optional.of(testRecord));

            assertThatThrownBy(() -> maintenanceService.cancelMaintenance(maintenanceId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Нельзя отменить завершённое обслуживание");
        }
    }
}
