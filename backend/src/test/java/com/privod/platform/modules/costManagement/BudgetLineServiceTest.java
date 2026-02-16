package com.privod.platform.modules.costManagement;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.BudgetLine;
import com.privod.platform.modules.costManagement.repository.BudgetLineRepository;
import com.privod.platform.modules.costManagement.service.BudgetLineService;
import com.privod.platform.modules.costManagement.web.dto.BudgetLineResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateBudgetLineRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateBudgetLineRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetLineServiceTest {

    @Mock
    private BudgetLineRepository budgetLineRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BudgetLineService budgetLineService;

    private UUID budgetLineId;
    private UUID projectId;
    private UUID costCodeId;
    private BudgetLine testBudgetLine;

    @BeforeEach
    void setUp() {
        budgetLineId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        costCodeId = UUID.randomUUID();

        testBudgetLine = BudgetLine.builder()
                .projectId(projectId)
                .costCodeId(costCodeId)
                .description("Строительно-монтажные работы")
                .originalBudget(new BigDecimal("10000000.00"))
                .approvedChanges(new BigDecimal("500000.00"))
                .committedCost(new BigDecimal("7000000.00"))
                .actualCost(new BigDecimal("4000000.00"))
                .forecastFinalCost(new BigDecimal("11000000.00"))
                .build();
        testBudgetLine.setId(budgetLineId);
        testBudgetLine.setCreatedAt(Instant.now());
        testBudgetLine.recalculate();
    }

    @Nested
    @DisplayName("Budget Variance Calculations")
    class BudgetVarianceTests {

        @Test
        @DisplayName("Should calculate revisedBudget = originalBudget + approvedChanges")
        void revisedBudget_Calculation() {
            assertThat(testBudgetLine.getRevisedBudget())
                    .isEqualByComparingTo(new BigDecimal("10500000.00"));
        }

        @Test
        @DisplayName("Should calculate varianceAmount = revisedBudget - forecastFinalCost")
        void varianceAmount_Calculation() {
            // revisedBudget = 10500000, forecastFinalCost = 11000000
            // variance = 10500000 - 11000000 = -500000
            assertThat(testBudgetLine.getVarianceAmount())
                    .isEqualByComparingTo(new BigDecimal("-500000.00"));
        }

        @Test
        @DisplayName("Should calculate positive variance when under budget")
        void varianceAmount_UnderBudget() {
            testBudgetLine.setForecastFinalCost(new BigDecimal("9000000.00"));
            testBudgetLine.recalculate();

            // variance = 10500000 - 9000000 = 1500000
            assertThat(testBudgetLine.getVarianceAmount())
                    .isEqualByComparingTo(new BigDecimal("1500000.00"));
            assertThat(testBudgetLine.getVarianceAmount().compareTo(BigDecimal.ZERO) > 0).isTrue();
        }

        @Test
        @DisplayName("Should calculate uncommitted budget correctly")
        void uncommittedBudget_Calculation() {
            // uncommitted = revisedBudget - committedCost = 10500000 - 7000000 = 3500000
            assertThat(testBudgetLine.getUncommittedBudget())
                    .isEqualByComparingTo(new BigDecimal("3500000.00"));
        }
    }

    @Nested
    @DisplayName("Create Budget Line")
    class CreateBudgetLineTests {

        @Test
        @DisplayName("Should create budget line with computed fields")
        void create_CalculatesComputedFields() {
            CreateBudgetLineRequest request = new CreateBudgetLineRequest(
                    projectId, costCodeId, "Материалы",
                    new BigDecimal("5000000.00"), new BigDecimal("200000.00"),
                    new BigDecimal("5500000.00"));

            when(budgetLineRepository.findByProjectIdAndCostCodeIdAndDeletedFalse(projectId, costCodeId))
                    .thenReturn(Optional.empty());
            when(budgetLineRepository.save(any(BudgetLine.class))).thenAnswer(inv -> {
                BudgetLine bl = inv.getArgument(0);
                bl.setId(UUID.randomUUID());
                bl.setCreatedAt(Instant.now());
                return bl;
            });

            BudgetLineResponse response = budgetLineService.create(request);

            assertThat(response.originalBudget()).isEqualByComparingTo(new BigDecimal("5000000.00"));
            assertThat(response.revisedBudget()).isEqualByComparingTo(new BigDecimal("5200000.00"));
            assertThat(response.varianceAmount()).isEqualByComparingTo(new BigDecimal("-300000.00"));
            verify(auditService).logCreate(eq("BudgetLine"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate budget line for same cost code in project")
        void create_DuplicateCostCode() {
            CreateBudgetLineRequest request = new CreateBudgetLineRequest(
                    projectId, costCodeId, "Материалы",
                    new BigDecimal("5000000.00"), null, null);

            when(budgetLineRepository.findByProjectIdAndCostCodeIdAndDeletedFalse(projectId, costCodeId))
                    .thenReturn(Optional.of(testBudgetLine));

            assertThatThrownBy(() -> budgetLineService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Строка бюджета для данного кода затрат уже существует");
        }
    }

    @Nested
    @DisplayName("Update Budget Line")
    class UpdateBudgetLineTests {

        @Test
        @DisplayName("Should update budget line and recalculate computed fields")
        void update_RecalculatesFields() {
            when(budgetLineRepository.findById(budgetLineId)).thenReturn(Optional.of(testBudgetLine));
            when(budgetLineRepository.save(any(BudgetLine.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateBudgetLineRequest request = new UpdateBudgetLineRequest(
                    null, null, new BigDecimal("1000000.00"),
                    null, null, new BigDecimal("12000000.00"));

            BudgetLineResponse response = budgetLineService.update(budgetLineId, request);

            // revisedBudget = 10000000 + 1000000 = 11000000
            assertThat(response.revisedBudget()).isEqualByComparingTo(new BigDecimal("11000000.00"));
            // variance = 11000000 - 12000000 = -1000000
            assertThat(response.varianceAmount()).isEqualByComparingTo(new BigDecimal("-1000000.00"));
        }
    }

    @Test
    @DisplayName("Should throw when budget line not found")
    void getById_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(budgetLineRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetLineService.getById(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Строка бюджета не найдена");
    }
}
