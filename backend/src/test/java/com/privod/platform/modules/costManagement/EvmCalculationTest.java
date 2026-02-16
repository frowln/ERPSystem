package com.privod.platform.modules.costManagement;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.CostForecast;
import com.privod.platform.modules.costManagement.domain.ForecastMethod;
import com.privod.platform.modules.costManagement.repository.CostForecastRepository;
import com.privod.platform.modules.costManagement.service.CostForecastService;
import com.privod.platform.modules.costManagement.web.dto.CostForecastResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCostForecastRequest;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EvmCalculationTest {

    @Mock
    private CostForecastRepository costForecastRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CostForecastService costForecastService;

    private UUID projectId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("EVM Indicator Calculations")
    class EvmIndicatorTests {

        @Test
        @DisplayName("Should correctly calculate CPI = EV / AC")
        void calculateCpi() {
            CostForecast forecast = CostForecast.builder()
                    .projectId(projectId)
                    .forecastDate(LocalDate.now())
                    .budgetAtCompletion(new BigDecimal("1000000.00"))
                    .earnedValue(new BigDecimal("500000.00"))
                    .plannedValue(new BigDecimal("600000.00"))
                    .actualCost(new BigDecimal("550000.00"))
                    .build();

            forecast.calculateEvmIndicators();

            // CPI = 500000 / 550000 = 0.9091
            assertThat(forecast.getCostPerformanceIndex())
                    .isEqualByComparingTo(new BigDecimal("0.9091"));
        }

        @Test
        @DisplayName("Should correctly calculate SPI = EV / PV")
        void calculateSpi() {
            CostForecast forecast = CostForecast.builder()
                    .projectId(projectId)
                    .forecastDate(LocalDate.now())
                    .budgetAtCompletion(new BigDecimal("1000000.00"))
                    .earnedValue(new BigDecimal("500000.00"))
                    .plannedValue(new BigDecimal("600000.00"))
                    .actualCost(new BigDecimal("550000.00"))
                    .build();

            forecast.calculateEvmIndicators();

            // SPI = 500000 / 600000 = 0.8333
            assertThat(forecast.getSchedulePerformanceIndex())
                    .isEqualByComparingTo(new BigDecimal("0.8333"));
        }

        @Test
        @DisplayName("Should correctly calculate CV = EV - AC")
        void calculateCostVariance() {
            CostForecast forecast = CostForecast.builder()
                    .projectId(projectId)
                    .forecastDate(LocalDate.now())
                    .budgetAtCompletion(new BigDecimal("1000000.00"))
                    .earnedValue(new BigDecimal("500000.00"))
                    .plannedValue(new BigDecimal("600000.00"))
                    .actualCost(new BigDecimal("550000.00"))
                    .build();

            forecast.calculateEvmIndicators();

            // CV = 500000 - 550000 = -50000
            assertThat(forecast.getCostVariance())
                    .isEqualByComparingTo(new BigDecimal("-50000.00"));
        }

        @Test
        @DisplayName("Should correctly calculate SV = EV - PV")
        void calculateScheduleVariance() {
            CostForecast forecast = CostForecast.builder()
                    .projectId(projectId)
                    .forecastDate(LocalDate.now())
                    .budgetAtCompletion(new BigDecimal("1000000.00"))
                    .earnedValue(new BigDecimal("500000.00"))
                    .plannedValue(new BigDecimal("600000.00"))
                    .actualCost(new BigDecimal("550000.00"))
                    .build();

            forecast.calculateEvmIndicators();

            // SV = 500000 - 600000 = -100000
            assertThat(forecast.getScheduleVariance())
                    .isEqualByComparingTo(new BigDecimal("-100000.00"));
        }

        @Test
        @DisplayName("Should correctly calculate EAC = BAC / CPI")
        void calculateEac() {
            CostForecast forecast = CostForecast.builder()
                    .projectId(projectId)
                    .forecastDate(LocalDate.now())
                    .budgetAtCompletion(new BigDecimal("1000000.00"))
                    .earnedValue(new BigDecimal("500000.00"))
                    .plannedValue(new BigDecimal("600000.00"))
                    .actualCost(new BigDecimal("550000.00"))
                    .build();

            forecast.calculateEvmIndicators();

            // EAC = 1000000 / 0.9091 = 1100011.00 (approx)
            assertThat(forecast.getEstimateAtCompletion()).isNotNull();
            assertThat(forecast.getEstimateAtCompletion().compareTo(new BigDecimal("1000000.00")) > 0).isTrue();
        }

        @Test
        @DisplayName("Should correctly calculate ETC = EAC - AC")
        void calculateEtc() {
            CostForecast forecast = CostForecast.builder()
                    .projectId(projectId)
                    .forecastDate(LocalDate.now())
                    .budgetAtCompletion(new BigDecimal("1000000.00"))
                    .earnedValue(new BigDecimal("500000.00"))
                    .plannedValue(new BigDecimal("600000.00"))
                    .actualCost(new BigDecimal("550000.00"))
                    .build();

            forecast.calculateEvmIndicators();

            // ETC = EAC - AC
            BigDecimal expectedEtc = forecast.getEstimateAtCompletion().subtract(new BigDecimal("550000.00"));
            assertThat(forecast.getEstimateToComplete()).isEqualByComparingTo(expectedEtc);
        }

        @Test
        @DisplayName("Should correctly calculate VAC = BAC - EAC")
        void calculateVac() {
            CostForecast forecast = CostForecast.builder()
                    .projectId(projectId)
                    .forecastDate(LocalDate.now())
                    .budgetAtCompletion(new BigDecimal("1000000.00"))
                    .earnedValue(new BigDecimal("500000.00"))
                    .plannedValue(new BigDecimal("600000.00"))
                    .actualCost(new BigDecimal("550000.00"))
                    .build();

            forecast.calculateEvmIndicators();

            // VAC = BAC - EAC (should be negative since over budget)
            BigDecimal expectedVac = new BigDecimal("1000000.00").subtract(forecast.getEstimateAtCompletion());
            assertThat(forecast.getVarianceAtCompletion()).isEqualByComparingTo(expectedVac);
            assertThat(forecast.getVarianceAtCompletion().compareTo(BigDecimal.ZERO) < 0).isTrue();
        }

        @Test
        @DisplayName("Should handle zero AC gracefully for CPI calculation")
        void calculateCpi_ZeroAc() {
            CostForecast forecast = CostForecast.builder()
                    .projectId(projectId)
                    .forecastDate(LocalDate.now())
                    .budgetAtCompletion(new BigDecimal("1000000.00"))
                    .earnedValue(new BigDecimal("100000.00"))
                    .plannedValue(new BigDecimal("100000.00"))
                    .actualCost(BigDecimal.ZERO)
                    .build();

            forecast.calculateEvmIndicators();

            assertThat(forecast.getCostPerformanceIndex()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Forecast Service")
    class ForecastServiceTests {

        @Test
        @DisplayName("Should create forecast with calculated EVM indicators")
        void createForecast_CalculatesEvm() {
            CreateCostForecastRequest request = new CreateCostForecastRequest(
                    projectId, LocalDate.now(), ForecastMethod.EARNED_VALUE,
                    new BigDecimal("1000000.00"), new BigDecimal("400000.00"),
                    new BigDecimal("500000.00"), new BigDecimal("450000.00"),
                    new BigDecimal("40.00"), "Прогноз за февраль", null);

            when(costForecastRepository.save(any(CostForecast.class))).thenAnswer(inv -> {
                CostForecast cf = inv.getArgument(0);
                cf.setId(UUID.randomUUID());
                cf.setCreatedAt(Instant.now());
                return cf;
            });

            CostForecastResponse response = costForecastService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.forecastMethod()).isEqualTo(ForecastMethod.EARNED_VALUE);
            // CPI = 400000 / 450000 = 0.8889
            assertThat(response.costPerformanceIndex()).isNotNull();
            assertThat(response.costPerformanceIndex().compareTo(BigDecimal.ZERO) > 0).isTrue();
            // SPI = 400000 / 500000 = 0.8
            assertThat(response.schedulePerformanceIndex()).isNotNull();
            verify(auditService).logCreate("CostForecast", response.id());
        }

        @Test
        @DisplayName("Should create EVM snapshot with current date")
        void createSnapshot_SetsCurrentDate() {
            when(costForecastRepository.save(any(CostForecast.class))).thenAnswer(inv -> {
                CostForecast cf = inv.getArgument(0);
                cf.setId(UUID.randomUUID());
                cf.setCreatedAt(Instant.now());
                return cf;
            });

            CostForecastResponse response = costForecastService.createSnapshot(
                    projectId,
                    new BigDecimal("2000000.00"),
                    new BigDecimal("800000.00"),
                    new BigDecimal("900000.00"),
                    new BigDecimal("850000.00"),
                    new BigDecimal("40.00"),
                    "Ежемесячный снимок"
            );

            assertThat(response).isNotNull();
            assertThat(response.forecastDate()).isEqualTo(LocalDate.now());
            assertThat(response.forecastMethod()).isEqualTo(ForecastMethod.EARNED_VALUE);
            assertThat(response.costVariance()).isNotNull();
            assertThat(response.scheduleVariance()).isNotNull();
        }
    }
}
