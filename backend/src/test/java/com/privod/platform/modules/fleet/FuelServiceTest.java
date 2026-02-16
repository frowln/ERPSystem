package com.privod.platform.modules.fleet;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.fleet.domain.FuelType;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.domain.VehicleType;
import com.privod.platform.modules.fleet.repository.FuelRecordRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.service.FuelService;
import com.privod.platform.modules.fleet.web.dto.CreateFuelRecordRequest;
import com.privod.platform.modules.fleet.web.dto.FuelConsumptionReportResponse;
import com.privod.platform.modules.fleet.web.dto.FuelRecordResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class FuelServiceTest {

    @Mock
    private FuelRecordRepository fuelRecordRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private FuelService fuelService;

    private UUID vehicleId;
    private Vehicle testVehicle;

    @BeforeEach
    void setUp() {
        vehicleId = UUID.randomUUID();

        testVehicle = Vehicle.builder()
                .code("VEH-00001")
                .vehicleType(VehicleType.TRUCK)
                .status(VehicleStatus.IN_USE)
                .fuelType(FuelType.DIESEL)
                .currentMileage(new BigDecimal("50000.00"))
                .build();
        testVehicle.setId(vehicleId);
        testVehicle.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("Should create fuel record and calculate total cost")
    void createFuelRecord_CalculatesTotalCost() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
        when(fuelRecordRepository.save(any())).thenAnswer(inv -> {
            var r = inv.getArgument(0, com.privod.platform.modules.fleet.domain.FuelRecord.class);
            r.setId(UUID.randomUUID());
            r.setCreatedAt(Instant.now());
            return r;
        });
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateFuelRecordRequest request = new CreateFuelRecordRequest(
                vehicleId, UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.now(), new BigDecimal("150.00"), new BigDecimal("65.50"),
                new BigDecimal("50150.00"), null, "АЗС Лукойл", "REC-001"
        );

        FuelRecordResponse response = fuelService.createFuelRecord(request);

        assertThat(response.totalCost()).isEqualByComparingTo(new BigDecimal("9825.00"));
        assertThat(response.quantity()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(response.pricePerUnit()).isEqualByComparingTo(new BigDecimal("65.50"));
        assertThat(testVehicle.getCurrentMileage()).isEqualByComparingTo(new BigDecimal("50150.00"));
        verify(auditService).logCreate(eq("FuelRecord"), any(UUID.class));
    }

    @Test
    @DisplayName("Should reject fuel record for non-existent vehicle")
    void createFuelRecord_VehicleNotFound() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.empty());

        CreateFuelRecordRequest request = new CreateFuelRecordRequest(
                vehicleId, null, null,
                LocalDate.now(), new BigDecimal("100.00"), new BigDecimal("60.00"),
                null, null, null, null
        );

        assertThatThrownBy(() -> fuelService.createFuelRecord(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Техника не найдена");
    }

    @Test
    @DisplayName("Should generate fuel consumption report with average price")
    void getFuelConsumptionReport_WithData() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 1, 31);

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(testVehicle));
        when(fuelRecordRepository.sumQuantityByVehicleIdAndDateRange(vehicleId, from, to))
                .thenReturn(new BigDecimal("500.00"));
        when(fuelRecordRepository.sumCostByVehicleIdAndDateRange(vehicleId, from, to))
                .thenReturn(new BigDecimal("32750.00"));

        FuelConsumptionReportResponse report = fuelService.getFuelConsumptionReport(vehicleId, from, to);

        assertThat(report.vehicleId()).isEqualTo(vehicleId);
        assertThat(report.vehicleCode()).isEqualTo("VEH-00001");
        assertThat(report.totalQuantity()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(report.totalCost()).isEqualByComparingTo(new BigDecimal("32750.00"));
        assertThat(report.averagePricePerUnit()).isEqualByComparingTo(new BigDecimal("65.50"));
    }
}
