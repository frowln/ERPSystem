package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.CostForecast;
import com.privod.platform.modules.costManagement.domain.ForecastMethod;
import com.privod.platform.modules.costManagement.repository.CostForecastRepository;
import com.privod.platform.modules.costManagement.web.dto.CostForecastResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCostForecastRequest;
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
class CostForecastServiceTest {

    @Mock
    private CostForecastRepository costForecastRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CostForecastService costForecastService;

    private UUID forecastId;
    private UUID projectId;
    private CostForecast testForecast;

    @BeforeEach
    void setUp() {
        forecastId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testForecast = CostForecast.builder()
                .projectId(projectId)
                .forecastDate(LocalDate.of(2025, 6, 1))
                .forecastMethod(ForecastMethod.EARNED_VALUE)
                .budgetAtCompletion(new BigDecimal("10000000.00"))
                .earnedValue(new BigDecimal("4000000.00"))
                .plannedValue(new BigDecimal("5000000.00"))
                .actualCost(new BigDecimal("4500000.00"))
                .percentComplete(new BigDecimal("40.00"))
                .notes("Прогноз на середину проекта")
                .build();
        testForecast.calculateEvmIndicators();
        testForecast.setId(forecastId);
        testForecast.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Cost Forecast")
    class CreateTests {

        @Test
        @DisplayName("Should create forecast with calculated EVM indicators")
        void shouldCreateForecast_withEvmCalculations() {
            CreateCostForecastRequest request = new CreateCostForecastRequest(
                    projectId, LocalDate.of(2025, 7, 1),
                    ForecastMethod.EARNED_VALUE,
                    new BigDecimal("10000000.00"),
                    new BigDecimal("5000000.00"),
                    new BigDecimal("6000000.00"),
                    new BigDecimal("5500000.00"),
                    new BigDecimal("50.00"),
                    "Июльский прогноз",
                    UUID.randomUUID());

            when(costForecastRepository.save(any(CostForecast.class))).thenAnswer(inv -> {
                CostForecast f = inv.getArgument(0);
                f.setId(UUID.randomUUID());
                f.setCreatedAt(Instant.now());
                return f;
            });

            CostForecastResponse response = costForecastService.create(request);

            assertThat(response.forecastMethod()).isEqualTo(ForecastMethod.EARNED_VALUE);
            assertThat(response.budgetAtCompletion()).isEqualByComparingTo(new BigDecimal("10000000.00"));
            // CPI = EV / AC = 5000000 / 5500000 = 0.9091
            assertThat(response.costPerformanceIndex()).isNotNull();
            // SPI = EV / PV = 5000000 / 6000000 = 0.8333
            assertThat(response.schedulePerformanceIndex()).isNotNull();
            // CV = EV - AC = 5000000 - 5500000 = -500000
            assertThat(response.costVariance()).isEqualByComparingTo(new BigDecimal("-500000.00"));
            // SV = EV - PV = 5000000 - 6000000 = -1000000
            assertThat(response.scheduleVariance()).isEqualByComparingTo(new BigDecimal("-1000000.00"));
            verify(auditService).logCreate(eq("CostForecast"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default forecast method to MANUAL when null")
        void shouldDefaultToManual_whenMethodNull() {
            CreateCostForecastRequest request = new CreateCostForecastRequest(
                    projectId, LocalDate.of(2025, 7, 1),
                    null,
                    new BigDecimal("10000000.00"),
                    null, null, null, null,
                    "Ручной прогноз", null);

            when(costForecastRepository.save(any(CostForecast.class))).thenAnswer(inv -> {
                CostForecast f = inv.getArgument(0);
                f.setId(UUID.randomUUID());
                f.setCreatedAt(Instant.now());
                return f;
            });

            CostForecastResponse response = costForecastService.create(request);

            assertThat(response.forecastMethod()).isEqualTo(ForecastMethod.MANUAL);
        }

        @Test
        @DisplayName("Should handle zero actual cost in EVM calculation (CPI=0)")
        void shouldHandleZeroActualCost_inEvmCalculation() {
            CreateCostForecastRequest request = new CreateCostForecastRequest(
                    projectId, LocalDate.now(),
                    ForecastMethod.EARNED_VALUE,
                    new BigDecimal("1000000.00"),
                    new BigDecimal("100000.00"),
                    new BigDecimal("200000.00"),
                    BigDecimal.ZERO,
                    new BigDecimal("10.00"),
                    null, null);

            when(costForecastRepository.save(any(CostForecast.class))).thenAnswer(inv -> {
                CostForecast f = inv.getArgument(0);
                f.setId(UUID.randomUUID());
                f.setCreatedAt(Instant.now());
                return f;
            });

            CostForecastResponse response = costForecastService.create(request);

            assertThat(response.costPerformanceIndex()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Create Snapshot")
    class SnapshotTests {

        @Test
        @DisplayName("Should create EVM snapshot with today's date")
        void shouldCreateSnapshot_withTodaysDate() {
            when(costForecastRepository.save(any(CostForecast.class))).thenAnswer(inv -> {
                CostForecast f = inv.getArgument(0);
                f.setId(UUID.randomUUID());
                f.setCreatedAt(Instant.now());
                return f;
            });

            CostForecastResponse response = costForecastService.createSnapshot(
                    projectId,
                    new BigDecimal("10000000.00"),
                    new BigDecimal("4000000.00"),
                    new BigDecimal("5000000.00"),
                    new BigDecimal("4500000.00"),
                    new BigDecimal("40.00"),
                    "Snapshot note");

            assertThat(response.forecastMethod()).isEqualTo(ForecastMethod.EARNED_VALUE);
            assertThat(response.forecastDate()).isEqualTo(LocalDate.now());
            assertThat(response.notes()).isEqualTo("Snapshot note");
            verify(auditService).logCreate(eq("CostForecast"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Get Forecast")
    class GetTests {

        @Test
        @DisplayName("Should find forecast by ID")
        void shouldReturnForecast_whenExists() {
            when(costForecastRepository.findById(forecastId)).thenReturn(Optional.of(testForecast));

            CostForecastResponse response = costForecastService.getById(forecastId);

            assertThat(response).isNotNull();
            assertThat(response.forecastDate()).isEqualTo(LocalDate.of(2025, 6, 1));
            assertThat(response.budgetAtCompletion()).isEqualByComparingTo(new BigDecimal("10000000.00"));
        }

        @Test
        @DisplayName("Should throw when forecast not found")
        void shouldThrowException_whenForecastNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(costForecastRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> costForecastService.getById(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Прогноз затрат не найден");
        }

        @Test
        @DisplayName("Should get latest forecast for project")
        void shouldReturnLatestForecast_whenExists() {
            when(costForecastRepository.findFirstByProjectIdAndDeletedFalseOrderByForecastDateDesc(projectId))
                    .thenReturn(Optional.of(testForecast));

            CostForecastResponse response = costForecastService.getLatest(projectId);

            assertThat(response.projectId()).isEqualTo(projectId);
        }

        @Test
        @DisplayName("Should throw when no forecast exists for project")
        void shouldThrowException_whenNoForecastForProject() {
            UUID unknownProjectId = UUID.randomUUID();
            when(costForecastRepository.findFirstByProjectIdAndDeletedFalseOrderByForecastDateDesc(unknownProjectId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> costForecastService.getLatest(unknownProjectId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Прогноз затрат не найден для проекта");
        }

        @Test
        @DisplayName("Should return forecasts in date range")
        void shouldReturnForecasts_inDateRange() {
            LocalDate start = LocalDate.of(2025, 1, 1);
            LocalDate end = LocalDate.of(2025, 12, 31);

            when(costForecastRepository.findByProjectIdAndDateRange(projectId, start, end))
                    .thenReturn(List.of(testForecast));

            List<CostForecastResponse> responses = costForecastService.listByDateRange(projectId, start, end);

            assertThat(responses).hasSize(1);
        }
    }

    @Test
    @DisplayName("Should soft delete forecast")
    void shouldSoftDelete_whenValidId() {
        when(costForecastRepository.findById(forecastId)).thenReturn(Optional.of(testForecast));
        when(costForecastRepository.save(any(CostForecast.class))).thenAnswer(inv -> inv.getArgument(0));

        costForecastService.delete(forecastId);

        assertThat(testForecast.isDeleted()).isTrue();
        verify(auditService).logDelete("CostForecast", forecastId);
    }
}
