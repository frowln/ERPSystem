package com.privod.platform.modules.costManagement;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.CashFlowProjection;
import com.privod.platform.modules.costManagement.repository.CashFlowProjectionRepository;
import com.privod.platform.modules.costManagement.service.CashFlowProjectionService;
import com.privod.platform.modules.costManagement.web.dto.CashFlowProjectionResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCashFlowProjectionRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCashFlowProjectionRequest;
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
class CashFlowProjectionServiceTest {

    @Mock
    private CashFlowProjectionRepository cashFlowProjectionRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CashFlowProjectionService cashFlowProjectionService;

    private UUID projectionId;
    private UUID projectId;
    private CashFlowProjection testProjection;

    @BeforeEach
    void setUp() {
        projectionId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testProjection = CashFlowProjection.builder()
                .projectId(projectId)
                .periodStart(LocalDate.of(2025, 1, 1))
                .periodEnd(LocalDate.of(2025, 1, 31))
                .plannedIncome(new BigDecimal("5000000.00"))
                .plannedExpense(new BigDecimal("3000000.00"))
                .actualIncome(new BigDecimal("4500000.00"))
                .actualExpense(new BigDecimal("3200000.00"))
                .forecastIncome(new BigDecimal("5200000.00"))
                .forecastExpense(new BigDecimal("3100000.00"))
                .build();
        testProjection.setId(projectionId);
        testProjection.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Cash Flow Net Calculations")
    class CashFlowNetTests {

        @Test
        @DisplayName("Should calculate planned net correctly")
        void plannedNet() {
            // planned net = 5000000 - 3000000 = 2000000
            assertThat(testProjection.getPlannedNet())
                    .isEqualByComparingTo(new BigDecimal("2000000.00"));
        }

        @Test
        @DisplayName("Should calculate actual net correctly")
        void actualNet() {
            // actual net = 4500000 - 3200000 = 1300000
            assertThat(testProjection.getActualNet())
                    .isEqualByComparingTo(new BigDecimal("1300000.00"));
        }

        @Test
        @DisplayName("Should calculate forecast net correctly")
        void forecastNet() {
            // forecast net = 5200000 - 3100000 = 2100000
            assertThat(testProjection.getForecastNet())
                    .isEqualByComparingTo(new BigDecimal("2100000.00"));
        }
    }

    @Nested
    @DisplayName("Create Projection")
    class CreateProjectionTests {

        @Test
        @DisplayName("Should create cash flow projection with calculated nets")
        void create_CalculatesNets() {
            CreateCashFlowProjectionRequest request = new CreateCashFlowProjectionRequest(
                    projectId, LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28),
                    new BigDecimal("6000000.00"), new BigDecimal("4000000.00"),
                    BigDecimal.ZERO, BigDecimal.ZERO,
                    new BigDecimal("6500000.00"), new BigDecimal("4200000.00"),
                    "Февральский прогноз");

            when(cashFlowProjectionRepository.save(any(CashFlowProjection.class))).thenAnswer(inv -> {
                CashFlowProjection p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            CashFlowProjectionResponse response = cashFlowProjectionService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.plannedNet()).isEqualByComparingTo(new BigDecimal("2000000.00"));
            assertThat(response.forecastNet()).isEqualByComparingTo(new BigDecimal("2300000.00"));
            verify(auditService).logCreate(eq("CashFlowProjection"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject creation when end date is before start date")
        void create_InvalidPeriod() {
            CreateCashFlowProjectionRequest request = new CreateCashFlowProjectionRequest(
                    projectId, LocalDate.of(2025, 3, 31), LocalDate.of(2025, 3, 1),
                    null, null, null, null, null, null, null);

            assertThatThrownBy(() -> cashFlowProjectionService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания периода должна быть позже даты начала");
        }
    }

    @Nested
    @DisplayName("Update Projection")
    class UpdateProjectionTests {

        @Test
        @DisplayName("Should update projection and recalculate cumulatives")
        void update_RecalculatesCumulatives() {
            when(cashFlowProjectionRepository.findById(projectionId)).thenReturn(Optional.of(testProjection));
            when(cashFlowProjectionRepository.save(any(CashFlowProjection.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateCashFlowProjectionRequest request = new UpdateCashFlowProjectionRequest(
                    null, null,
                    null, null,
                    new BigDecimal("5000000.00"), new BigDecimal("3500000.00"),
                    null, null, "Обновлённые фактические данные");

            CashFlowProjectionResponse response = cashFlowProjectionService.update(projectionId, request);

            assertThat(response.actualIncome()).isEqualByComparingTo(new BigDecimal("5000000.00"));
            assertThat(response.actualExpense()).isEqualByComparingTo(new BigDecimal("3500000.00"));
            assertThat(response.actualNet()).isEqualByComparingTo(new BigDecimal("1500000.00"));
            verify(auditService).logUpdate("CashFlowProjection", projectionId, "multiple", null, null);
        }
    }

    @Test
    @DisplayName("Should throw when projection not found")
    void getById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(cashFlowProjectionRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cashFlowProjectionService.getById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Проекция денежного потока не найдена");
    }
}
