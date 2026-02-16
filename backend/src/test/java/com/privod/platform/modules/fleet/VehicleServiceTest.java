package com.privod.platform.modules.fleet;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.fleet.domain.AssignmentStatus;
import com.privod.platform.modules.fleet.domain.FuelType;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.domain.VehicleAssignment;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.domain.VehicleType;
import com.privod.platform.modules.fleet.repository.VehicleAssignmentRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.service.VehicleService;
import com.privod.platform.modules.fleet.web.dto.AssignVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.CreateVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.VehicleAssignmentResponse;
import com.privod.platform.modules.fleet.web.dto.VehicleResponse;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private VehicleAssignmentRepository assignmentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private VehicleService vehicleService;

    private UUID vehicleId;
    private UUID projectId;
    private Vehicle testVehicle;

    @BeforeEach
    void setUp() {
        vehicleId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testVehicle = Vehicle.builder()
                .code("VEH-00001")
                .licensePlate("A123BC77")
                .make("Caterpillar")
                .model("320D")
                .year(2022)
                .vin("CAT320D2022001")
                .vehicleType(VehicleType.EXCAVATOR)
                .status(VehicleStatus.AVAILABLE)
                .fuelType(FuelType.DIESEL)
                .fuelConsumptionRate(new BigDecimal("25.00"))
                .purchaseDate(LocalDate.of(2022, 6, 1))
                .purchasePrice(new BigDecimal("15000000.00"))
                .currentValue(new BigDecimal("12000000.00"))
                .depreciationRate(new BigDecimal("10.00"))
                .currentMileage(BigDecimal.ZERO)
                .currentHours(new BigDecimal("1500.00"))
                .insuranceExpiryDate(LocalDate.of(2026, 6, 1))
                .techInspectionExpiryDate(LocalDate.of(2026, 3, 15))
                .build();
        testVehicle.setId(vehicleId);
        testVehicle.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Vehicle")
    class CreateVehicleTests {

        @Test
        @DisplayName("Should create vehicle with AVAILABLE status and auto-generated code")
        void createVehicle_SetsDefaultAvailableStatusAndGeneratesCode() {
            CreateVehicleRequest request = new CreateVehicleRequest(
                    "A123BC77", "Caterpillar", "320D", 2022, "CAT320D2022001",
                    VehicleType.EXCAVATOR, null, null, null,
                    LocalDate.of(2022, 6, 1), new BigDecimal("15000000.00"), null,
                    new BigDecimal("10.00"), FuelType.DIESEL, new BigDecimal("25.00"),
                    BigDecimal.ZERO, new BigDecimal("1500.00"),
                    LocalDate.of(2026, 6, 1), LocalDate.of(2026, 3, 15), null
            );

            when(vehicleRepository.getNextCodeSequence()).thenReturn(1L);
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> {
                Vehicle v = invocation.getArgument(0);
                v.setId(UUID.randomUUID());
                v.setCreatedAt(Instant.now());
                return v;
            });

            VehicleResponse response = vehicleService.createVehicle(request);

            assertThat(response.status()).isEqualTo(VehicleStatus.AVAILABLE);
            assertThat(response.code()).isEqualTo("VEH-00001");
            assertThat(response.vehicleType()).isEqualTo(VehicleType.EXCAVATOR);
            assertThat(response.make()).isEqualTo("Caterpillar");
            verify(auditService).logCreate(eq("Vehicle"), any(UUID.class));
        }

        @Test
        @DisplayName("Should set currentValue to purchasePrice when not provided")
        void createVehicle_DefaultsCurrentValueToPurchasePrice() {
            CreateVehicleRequest request = new CreateVehicleRequest(
                    null, "Komatsu", "PC200", 2023, null,
                    VehicleType.EXCAVATOR, null, null, null,
                    null, new BigDecimal("12000000.00"), null,
                    null, FuelType.DIESEL, null,
                    null, null, null, null, null
            );

            when(vehicleRepository.getNextCodeSequence()).thenReturn(2L);
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> {
                Vehicle v = invocation.getArgument(0);
                v.setId(UUID.randomUUID());
                v.setCreatedAt(Instant.now());
                return v;
            });

            VehicleResponse response = vehicleService.createVehicle(request);

            assertThat(response.currentValue()).isEqualByComparingTo(new BigDecimal("12000000.00"));
        }
    }

    @Nested
    @DisplayName("Vehicle Assignment Workflow")
    class AssignmentWorkflowTests {

        @Test
        @DisplayName("Should assign available vehicle to project and set status to IN_USE")
        void assignToProject_AvailableVehicle() {
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));
            when(assignmentRepository.save(any(VehicleAssignment.class))).thenAnswer(inv -> {
                VehicleAssignment a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            AssignVehicleRequest request = new AssignVehicleRequest(
                    projectId, UUID.randomUUID(),
                    LocalDate.now(), LocalDate.now().plusDays(30),
                    new BigDecimal("50000.00"), "Строительство котлована"
            );

            VehicleAssignmentResponse response = vehicleService.assignToProject(vehicleId, request);

            assertThat(response.status()).isEqualTo(AssignmentStatus.ACTIVE);
            assertThat(response.projectId()).isEqualTo(projectId);
            assertThat(response.dailyRate()).isEqualByComparingTo(new BigDecimal("50000.00"));
            assertThat(testVehicle.getStatus()).isEqualTo(VehicleStatus.IN_USE);
            assertThat(testVehicle.getCurrentProjectId()).isEqualTo(projectId);
            verify(auditService).logStatusChange("Vehicle", vehicleId, "AVAILABLE", "IN_USE");
        }

        @Test
        @DisplayName("Should reject assignment for non-available vehicle")
        void assignToProject_NonAvailableVehicle() {
            testVehicle.setStatus(VehicleStatus.MAINTENANCE);
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));

            AssignVehicleRequest request = new AssignVehicleRequest(
                    projectId, null, LocalDate.now(), null, null, null
            );

            assertThatThrownBy(() -> vehicleService.assignToProject(vehicleId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("недоступна для назначения");
        }

        @Test
        @DisplayName("Should return vehicle from project and calculate total cost")
        void returnFromProject_CalculatesTotalCost() {
            testVehicle.setStatus(VehicleStatus.IN_USE);
            testVehicle.setCurrentProjectId(projectId);

            VehicleAssignment activeAssignment = VehicleAssignment.builder()
                    .vehicleId(vehicleId)
                    .projectId(projectId)
                    .startDate(LocalDate.now().minusDays(10))
                    .status(AssignmentStatus.ACTIVE)
                    .dailyRate(new BigDecimal("50000.00"))
                    .build();
            activeAssignment.setId(UUID.randomUUID());
            activeAssignment.setCreatedAt(Instant.now());

            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
            when(assignmentRepository.findActiveAssignment(vehicleId)).thenReturn(Optional.of(activeAssignment));
            when(assignmentRepository.save(any(VehicleAssignment.class))).thenAnswer(inv -> inv.getArgument(0));
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

            VehicleAssignmentResponse response = vehicleService.returnFromProject(vehicleId);

            assertThat(response.status()).isEqualTo(AssignmentStatus.COMPLETED);
            assertThat(response.actualReturnDate()).isEqualTo(LocalDate.now());
            assertThat(response.totalCost()).isNotNull();
            assertThat(response.totalCost().compareTo(BigDecimal.ZERO)).isGreaterThan(0);
            assertThat(testVehicle.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
            assertThat(testVehicle.getCurrentProjectId()).isNull();
            verify(auditService).logStatusChange("Vehicle", vehicleId, "IN_USE", "AVAILABLE");
        }

        @Test
        @DisplayName("Should reject return for vehicle not in use")
        void returnFromProject_VehicleNotInUse() {
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));

            assertThatThrownBy(() -> vehicleService.returnFromProject(vehicleId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("не находится в использовании");
        }

        @Test
        @DisplayName("Should reject assignment when end date is before start date")
        void assignToProject_InvalidDates() {
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));

            AssignVehicleRequest request = new AssignVehicleRequest(
                    projectId, null,
                    LocalDate.of(2026, 6, 30), LocalDate.of(2026, 6, 1),
                    null, null
            );

            assertThatThrownBy(() -> vehicleService.assignToProject(vehicleId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания должна быть позже даты начала");
        }
    }

    @Nested
    @DisplayName("Delete Vehicle")
    class DeleteVehicleTests {

        @Test
        @DisplayName("Should reject deletion of vehicle in use")
        void deleteVehicle_InUse() {
            testVehicle.setStatus(VehicleStatus.IN_USE);
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));

            assertThatThrownBy(() -> vehicleService.deleteVehicle(vehicleId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Нельзя удалить технику");
        }
    }

    @Test
    @DisplayName("Should find vehicle by ID")
    void getVehicle_Success() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));

        VehicleResponse response = vehicleService.getVehicle(vehicleId);

        assertThat(response).isNotNull();
        assertThat(response.code()).isEqualTo("VEH-00001");
        assertThat(response.vehicleTypeDisplayName()).isEqualTo("Экскаватор");
        assertThat(response.statusDisplayName()).isEqualTo("Доступна");
    }

    @Test
    @DisplayName("Should throw when vehicle not found by ID")
    void getVehicle_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(vehicleRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vehicleService.getVehicle(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Техника не найдена");
    }
}
