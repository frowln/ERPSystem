package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.fleet.domain.AssignmentStatus;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.domain.VehicleAssignment;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.domain.VehicleType;
import com.privod.platform.modules.fleet.repository.VehicleAssignmentRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.AssignVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.CreateVehicleRequest;
import com.privod.platform.modules.fleet.web.dto.UpdateVehicleRequest;
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
                .make("KAMAZ")
                .model("6520")
                .year(2023)
                .vehicleType(VehicleType.TRUCK)
                .status(VehicleStatus.AVAILABLE)
                .purchasePrice(new BigDecimal("5000000.00"))
                .currentValue(new BigDecimal("4500000.00"))
                .build();
        testVehicle.setId(vehicleId);
        testVehicle.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Vehicle")
    class CreateTests {

        @Test
        @DisplayName("Should create vehicle with AVAILABLE status")
        void shouldCreate_withAvailableStatus() {
            CreateVehicleRequest request = new CreateVehicleRequest(
                    "B456DE99", "CAT", "320D", 2024, null,
                    VehicleType.EXCAVATOR, null, null, null,
                    LocalDate.of(2024, 1, 1), new BigDecimal("10000000.00"),
                    null, new BigDecimal("15.00"), "DIESEL",
                    new BigDecimal("25.00"), null, null,
                    LocalDate.of(2025, 12, 31), LocalDate.of(2025, 6, 30), null);

            when(vehicleRepository.getNextCodeSequence()).thenReturn(2L);
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> {
                Vehicle v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                v.setCreatedAt(Instant.now());
                return v;
            });

            VehicleResponse response = vehicleService.createVehicle(request);

            assertThat(response.status()).isEqualTo(VehicleStatus.AVAILABLE);
            assertThat(response.code()).isEqualTo("VEH-00002");
            verify(auditService).logCreate(eq("Vehicle"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Update Vehicle")
    class UpdateTests {

        @Test
        @DisplayName("Should update vehicle details")
        void shouldUpdate_whenValidInput() {
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateVehicleRequest request = new UpdateVehicleRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, null, null,
                    null, null, new BigDecimal("50000"),
                    null, null, null, "Scheduled maintenance needed");

            VehicleResponse response = vehicleService.updateVehicle(vehicleId, request);

            assertThat(response).isNotNull();
            verify(auditService).logUpdate(eq("Vehicle"), eq(vehicleId), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Vehicle Assignment")
    class AssignmentTests {

        @Test
        @DisplayName("Should assign available vehicle to project")
        void shouldAssign_whenAvailable() {
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
            when(assignmentRepository.save(any(VehicleAssignment.class))).thenAnswer(inv -> {
                VehicleAssignment a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

            AssignVehicleRequest request = new AssignVehicleRequest(
                    projectId, null, LocalDate.now(),
                    LocalDate.now().plusDays(30), new BigDecimal("15000.00"), null);

            VehicleAssignmentResponse response = vehicleService.assignToProject(vehicleId, request);

            assertThat(response).isNotNull();
            assertThat(testVehicle.getStatus()).isEqualTo(VehicleStatus.IN_USE);
            verify(auditService).logStatusChange("Vehicle", vehicleId, "AVAILABLE", "IN_USE");
        }

        @Test
        @DisplayName("Should reject assignment when not available")
        void shouldThrowException_whenNotAvailable() {
            testVehicle.setStatus(VehicleStatus.IN_USE);
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));

            AssignVehicleRequest request = new AssignVehicleRequest(
                    projectId, null, LocalDate.now(), null, null, null);

            assertThatThrownBy(() -> vehicleService.assignToProject(vehicleId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("недоступна");
        }

        @Test
        @DisplayName("Should reject assignment with end date before start date")
        void shouldThrowException_whenInvalidDates() {
            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));

            AssignVehicleRequest request = new AssignVehicleRequest(
                    projectId, null, LocalDate.of(2025, 12, 31),
                    LocalDate.of(2025, 1, 1), null, null);

            assertThatThrownBy(() -> vehicleService.assignToProject(vehicleId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания");
        }

        @Test
        @DisplayName("Should return vehicle from project")
        void shouldReturn_whenInUse() {
            testVehicle.setStatus(VehicleStatus.IN_USE);
            testVehicle.setCurrentProjectId(projectId);

            VehicleAssignment assignment = VehicleAssignment.builder()
                    .vehicleId(vehicleId)
                    .projectId(projectId)
                    .status(AssignmentStatus.ACTIVE)
                    .startDate(LocalDate.now().minusDays(10))
                    .dailyRate(new BigDecimal("10000.00"))
                    .build();
            assignment.setId(UUID.randomUUID());
            assignment.setCreatedAt(Instant.now());

            when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
            when(assignmentRepository.findActiveAssignment(vehicleId)).thenReturn(Optional.of(assignment));
            when(assignmentRepository.save(any(VehicleAssignment.class))).thenAnswer(inv -> inv.getArgument(0));
            when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

            VehicleAssignmentResponse response = vehicleService.returnFromProject(vehicleId);

            assertThat(response).isNotNull();
            assertThat(testVehicle.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
            assertThat(testVehicle.getCurrentProjectId()).isNull();
        }
    }

    @Test
    @DisplayName("Should reject deleting vehicle that is IN_USE")
    void shouldThrowException_whenDeletingInUseVehicle() {
        testVehicle.setStatus(VehicleStatus.IN_USE);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));

        assertThatThrownBy(() -> vehicleService.deleteVehicle(vehicleId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("в использовании");
    }

    @Test
    @DisplayName("Should soft delete available vehicle")
    void shouldSoftDelete_whenAvailable() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

        vehicleService.deleteVehicle(vehicleId);

        assertThat(testVehicle.isDeleted()).isTrue();
        verify(auditService).logDelete("Vehicle", vehicleId);
    }

    @Test
    @DisplayName("Should throw when vehicle not found")
    void shouldThrowException_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(vehicleRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vehicleService.getVehicle(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Техника не найдена");
    }
}
